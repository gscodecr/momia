from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json

router = APIRouter(prefix="/chat", tags=["chat"])

class ConnectionManager:
    def __init__(self):
        # Mapea user_id a su WebSocket activo
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    # En producción: validar JWT del usuario antes de aceptar la conexión
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                # Se espera un JSON del tipo: {"target_id": 2, "message": "Hola entrenador"}
                payload = json.loads(data)
                target_id = payload.get("target_id")
                message = payload.get("message")
                
                if target_id and message:
                    await manager.send_personal_message(
                        json.dumps({"sender_id": user_id, "message": message}), 
                        target_id
                    )
            except json.JSONDecodeError:
                pass # Ignorar mensajes mal formateados
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
