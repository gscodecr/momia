from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, BackgroundTasks
from typing import Dict, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import json
import models
from database import get_db, SessionLocal
from utils import send_push_notification
from auth import get_current_user
from jose import jwt, JWTError
import security
from fastapi import UploadFile, File
import utils

router = APIRouter(prefix="/chat", tags=["chat"])

class ConnectionManager:
    def __init__(self):
        # Mapea user_id a su WebSocket activo
        self.active_connections: Dict[int, WebSocket] = {}
        # Mapea user_id a target_id (quién está viendo actualmente)
        self.focused_chats: Dict[int, int] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.focused_chats:
            del self.focused_chats[user_id]

    def set_focus(self, user_id: int, target_id: int = None):
        self.focused_chats[user_id] = target_id

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(message)
            return True
        return False

manager = ConnectionManager()

@router.get("/contacts")
def get_chat_contacts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Returns all active users except the current user
    contacts = db.query(models.User).filter(
        models.User.id != current_user.id, 
        models.User.is_active == True
    ).all()
        
    result = []
    for u in contacts:
        unread = db.query(models.Message).filter(
            models.Message.sender_id == u.id,
            models.Message.target_id == current_user.id,
            models.Message.is_read == False
        ).count()
        
        result.append({
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role.name,
            "avatar_url": getattr(u, 'avatar_url', None),
            "unread_count": unread
        })
        
    # Sort by unread_count descending, then alphabetical
    result.sort(key=lambda x: (-x["unread_count"], x["first_name"]))
    return result

class BroadcastRequest(BaseModel):
    message: Optional[str] = None
    image_url: Optional[str] = None
    target_ids: List[int] # Lista de IDs o [-1] para enviar a todos

def process_broadcast(sender_id: int, request: BroadcastRequest):
    with SessionLocal() as db:
        sender_user = db.query(models.User).filter(models.User.id == sender_id).first()
        if not sender_user:
            return
            
        targets = request.target_ids
        if len(targets) == 1 and targets[0] == -1:
            # Enviar a todos excepto al emisor
            all_users = db.query(models.User.id).filter(models.User.id != sender_id, models.User.is_active == True).all()
            targets = [u[0] for u in all_users]
            
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
            
        for target_id in targets:
            new_msg = models.Message(
                sender_id=sender_id,
                target_id=target_id,
                content=request.message,
                image_url=request.image_url
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)
            
            # Prepare WS message
            ws_msg = json.dumps({
                "id": new_msg.id,
                "sender_id": sender_id,
                "message": request.message,
                "image_url": request.image_url,
                "created_at": str(new_msg.created_at)
            })
            
            # Check WS active connections
            was_sent = loop.run_until_complete(manager.send_personal_message(ws_msg, target_id))
            target_focused_on_me = manager.focused_chats.get(target_id) == sender_id
            
            if not target_focused_on_me:
                notif = models.Notification(
                    user_id=target_id,
                    title=f"Aviso de {sender_user.first_name} {sender_user.last_name}",
                    message=request.message[:50] + "..." if len(request.message) > 50 else request.message,
                    type="CHAT",
                    related_id=sender_id
                )
                db.add(notif)
                db.commit()
                
                target_user = db.query(models.User).filter(models.User.id == target_id).first()
                if target_user and target_user.push_token:
                    from utils import send_push_notification
                    send_push_notification(
                        expo_push_token=target_user.push_token,
                        title=f"Aviso de {sender_user.first_name}",
                        body=request.message,
                        data={"type": "CHAT", "sender_id": sender_id}
                    )
        loop.close()

from fastapi import BackgroundTasks

@router.post("/broadcast")
def send_broadcast_message(request: BroadcastRequest, background_tasks: BackgroundTasks, current_user: models.User = Depends(get_current_user)):
    if current_user.role.name not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para enviar mensajes masivos")
        
    background_tasks.add_task(process_broadcast, current_user.id, request)
    return {"message": "Mensajes en proceso de envío"}

@router.get("/history/{target_id}")
def get_chat_history(target_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    messages = db.query(models.Message).filter(
        or_(
            and_(models.Message.sender_id == current_user.id, models.Message.target_id == target_id),
            and_(models.Message.sender_id == target_id, models.Message.target_id == current_user.id)
        )
    ).order_by(models.Message.created_at.desc()).limit(limit).offset(offset).all()
    
    # Invertir para que los más antiguos salgan primero en UI
    messages.reverse()
    
    # Mark messages as read
    unread = db.query(models.Message).filter(
        models.Message.sender_id == target_id,
        models.Message.target_id == current_user.id,
        models.Message.is_read == False
    ).all()
    
    for msg in unread:
        msg.is_read = True
        
    # Delete CHAT notifications from this sender to keep the bell clean
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.type == "CHAT",
        models.Notification.related_id == target_id
    ).delete()
    
    db.commit()
    
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "target_id": m.target_id,
            "message": m.content,
            "image_url": m.image_url,
            "created_at": m.created_at
        } for m in messages
    ]

@router.post("/upload")
async def upload_chat_image(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
    try:
        url = utils.optimize_and_save_image(file, dest_folder="uploads/chat")
        return {"image_url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Archivo de imagen inválido o corrupto")

@router.put("/read/{target_id}")
def mark_chat_as_read(target_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # target_id is the person who sent the message (the one we are reading from)
    unread = db.query(models.Message).filter(
        models.Message.sender_id == target_id,
        models.Message.target_id == current_user.id,
        models.Message.is_read == False
    ).all()
    
    for msg in unread:
        msg.is_read = True
        
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.type == "CHAT",
        models.Notification.related_id == target_id
    ).delete()
    
    db.commit()
    return {"status": "ok"}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    db_conn = SessionLocal()
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            await websocket.close(code=1008)
            return
        user = db_conn.query(models.User).filter(models.User.email == email).first()
        if not user:
            await websocket.close(code=1008)
            return
        user_id = user.id
    except JWTError:
        await websocket.close(code=1008)
        return
    finally:
        db_conn.close()

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                
                # Manejar evento de foco
                action = payload.get("action")
                if action == "focus":
                    manager.set_focus(user_id, payload.get("target_id"))
                    continue
                    
                target_id = payload.get("target_id")
                message_text = payload.get("message")
                image_url = payload.get("image_url")
                
                if target_id and (message_text or image_url):
                    with SessionLocal() as db_session:
                        new_msg = models.Message(
                            sender_id=user_id,
                            target_id=target_id,
                            content=message_text,
                            image_url=image_url
                        )
                        db_session.add(new_msg)
                        db_session.commit()
                        db_session.refresh(new_msg)
                        
                        # Prepare WS message
                        ws_msg = json.dumps({
                            "id": new_msg.id,
                            "sender_id": user_id, 
                            "message": message_text,
                            "image_url": image_url,
                            "created_at": str(new_msg.created_at)
                        })
                        
                        target_user = db_session.query(models.User).filter(models.User.id == target_id).first()
                        sender_user = db_session.query(models.User).filter(models.User.id == user_id).first()
                        
                        target_push_token = target_user.push_token if target_user else None
                        sender_name = f"{sender_user.first_name} {sender_user.last_name}" if sender_user else "Usuario"
                        
                    was_sent = await manager.send_personal_message(ws_msg, target_id)
                    
                    target_focused_on_me = manager.focused_chats.get(target_id) == user_id
                    
                    if not target_focused_on_me:
                        with SessionLocal() as db_session:
                            notif = models.Notification(
                                user_id=target_id,
                                title=f"Nuevo mensaje de {sender_name}",
                                message="Te ha enviado una imagen" if image_url and not message_text else message_text,
                                type="CHAT",
                                related_id=user_id
                            )
                            db_session.add(notif)
                            db_session.commit()
                            
                        if target_push_token:
                            send_push_notification(
                                expo_push_token=target_push_token,
                                title=f"Nuevo mensaje de {sender_name}",
                                body="Te ha enviado una imagen" if image_url and not message_text else message_text,
                                data={"type": "CHAT", "sender_id": user_id}
                            )
                        
            except json.JSONDecodeError:
                pass # Ignorar mensajes mal formateados
            except Exception as e:
                print(f"WS error: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
