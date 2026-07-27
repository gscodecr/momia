import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
import threading
from dotenv import load_dotenv

load_dotenv()

# Configuración del servidor SMTP
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_NAME = os.getenv("SENDER_NAME", "Momia TS")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USER or "noreply@momiats.com")

def send_email_async(to_email: str, subject: str, html_content: str):
    """
    Envía un correo de forma asíncrona usando hilos para no bloquear la petición principal.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"⚠️ SMTP no configurado. Correo simulado a {to_email}: {subject}")
        return

    def _send():
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = formataddr((SENDER_NAME, SENDER_EMAIL))
            msg["To"] = to_email
            msg.set_content("Tu cliente de correo no soporta HTML.")
            msg.add_alternative(html_content, subtype='html')

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
                print(f"✅ Correo enviado exitosamente a {to_email}")
        except Exception as e:
            print(f"❌ Error al enviar correo a {to_email}: {e}")

    thread = threading.Thread(target=_send)
    thread.start()

# --- Plantilla Base ---
def get_base_html(title: str, content: str, action_url: str = None, action_text: str = None) -> str:
    button_html = ""
    if action_url and action_text:
        button_html = f"""
        <div style="text-align: center; margin: 30px 0;">
            <a href="{action_url}" style="background-color: #00b4d8; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                {action_text}
            </a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; color: #18181b; }}
            .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .header {{ background-color: #18181b; padding: 30px; text-align: center; border-bottom: 4px solid #00b4d8; }}
            .header img {{ max-height: 40px; }}
            .content {{ padding: 40px 30px; line-height: 1.6; font-size: 16px; color: #3f3f46; }}
            .content h1 {{ color: #18181b; margin-top: 0; font-size: 24px; }}
            .footer {{ background-color: #f4f4f5; padding: 20px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; }}
            .highlight {{ color: #00b4d8; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <!-- Se asume que el logo horizontal es oscuro, en fondo oscuro resalta bien -->
                <img src="https://momiats.com/logo_horizontal-04.png" alt="MOMIA TS" />
            </div>
            <div class="content">
                <h1>{title}</h1>
                {content}
                {button_html}
            </div>
            <div class="footer">
                © Momia Training System. Todos los derechos reservados.<br>
                Este es un correo generado automáticamente, por favor no respondas a este mensaje.
            </div>
        </div>
    </body>
    </html>
    """

# --- Correos Específicos ---

def send_welcome_email(to_email: str, first_name: str):
    content = f"""
    <p>Hola <strong>{first_name}</strong>,</p>
    <p>¡Bienvenido a <span class="highlight">Momia TS</span>! Hemos recibido tu solicitud de registro.</p>
    <p>En este momento, tu cuenta está <strong>en revisión</strong> por uno de nuestros administradores. Te enviaremos otro correo tan pronto como tu acceso haya sido aprobado.</p>
    <p>¡Estamos emocionados de que comiences a entrenar con nosotros!</p>
    """
    html = get_base_html("¡Bienvenido a Momia TS!", content)
    send_email_async(to_email, "Tu cuenta está en revisión - Momia TS", html)

def send_approval_email(to_email: str, first_name: str):
    content = f"""
    <p>Hola <strong>{first_name}</strong>,</p>
    <p>¡Excelentes noticias! Tu cuenta en <span class="highlight">Momia TS</span> ha sido <strong>aprobada</strong>.</p>
    <p>Ya puedes iniciar sesión en la plataforma y acceder a todas las herramientas para tu entrenamiento.</p>
    """
    html = get_base_html(
        "¡Tu cuenta ha sido aprobada!", 
        content, 
        action_url="https://momiats.com/login", 
        action_text="Iniciar Sesión"
    )
    send_email_async(to_email, "¡Cuenta Aprobada! - Momia TS", html)

def send_forgot_password_email(to_email: str, first_name: str, reset_token: str):
    reset_url = f"https://momiats.com/reset-password?token={reset_token}"
    content = f"""
    <p>Hola <strong>{first_name}</strong>,</p>
    <p>Hemos recibido una solicitud para restablecer tu contraseña en <span class="highlight">Momia TS</span>.</p>
    <p>Si no fuiste tú, puedes ignorar este correo sin problemas. De lo contrario, haz clic en el siguiente botón para crear una nueva contraseña:</p>
    """
    html = get_base_html(
        "Recuperación de Contraseña", 
        content, 
        action_url=reset_url, 
        action_text="Restablecer mi Contraseña"
    )
    send_email_async(to_email, "Recupera tu contraseña - Momia TS", html)

def send_workout_assigned_email(to_email: str, first_name: str, workout_title: str, date: str):
    content = f"""
    <p>Hola <strong>{first_name}</strong>,</p>
    <p>Tu coach te ha asignado un nuevo entrenamiento: <strong class="highlight">{workout_title}</strong>.</p>
    <p>Está programado para la fecha: <strong>{date}</strong>.</p>
    <p>Ingresa a tu planificador para ver todos los detalles.</p>
    """
    html = get_base_html(
        "Nuevo Entrenamiento Asignado", 
        content, 
        action_url="https://momiats.com/athlete/dashboard", 
        action_text="Ver Entrenamientos"
    )
    send_email_async(to_email, f"Nuevo Entrenamiento: {workout_title} - Momia TS", html)

def send_event_notification_email(to_email: str, event_title: str, date: str):
    content = f"""
    <p>¡Hola!</p>
    <p>Te avisamos que hay un nuevo evento en <span class="highlight">Momia TS</span>: <strong>{event_title}</strong>.</p>
    <p>Fecha programada: <strong>{date}</strong>.</p>
    <p>Inicia sesión para ver los detalles y unirte.</p>
    """
    html = get_base_html(
        "Nuevo Evento Creado", 
        content, 
        action_url="https://momiats.com/events", 
        action_text="Ver Eventos"
    )
    send_email_async(to_email, f"Nuevo Evento: {event_title} - Momia TS", html)

def send_product_notification_email(to_email: str, product_name: str):
    content = f"""
    <p>¡Hola!</p>
    <p>Hemos agregado un nuevo producto en nuestra tienda: <strong class="highlight">{product_name}</strong>.</p>
    <p>Visita el Marketplace para ver más detalles y adquirirlo antes de que se agote.</p>
    """
    html = get_base_html(
        "Nuevo Producto en Tienda", 
        content, 
        action_url="https://momiats.com/athlete/marketplace", 
        action_text="Ir a la Tienda"
    )
    send_email_async(to_email, f"Nuevo Producto: {product_name} - Momia TS", html)

def send_payment_receipt_email(to_email: str, first_name: str, amount: str, description: str):
    content = f"""
    <p>Hola <strong>{first_name}</strong>,</p>
    <p>Hemos procesado exitosamente tu pago por <strong class="highlight">₡{amount}</strong>.</p>
    <p><strong>Detalle:</strong> {description}</p>
    <p>Gracias por tu preferencia y por confiar en Momia TS.</p>
    """
    html = get_base_html("Recibo de Pago", content)
    send_email_async(to_email, "Recibo de Pago - Momia TS", html)

def send_event_registration_email(to_email: str, user_name: str, event_title: str):
    content = f"""
    <p>Hola <strong>{user_name}</strong>,</p>
    <p>Te has registrado exitosamente al evento:</p>
    <p><strong class="highlight">{event_title}</strong></p>
    <p>Nos vemos en la línea de salida. Sigue entrenando duro.</p>
    """
    html = get_base_html(
        "Registro Confirmado", 
        content, 
        action_url="https://momiats.com/events", 
        action_text="Ver mis eventos"
    )
    send_email_async(to_email, "Registro Confirmado - Momia TS", html)

def send_payment_status_email(to_email: str, user_name: str, amount: str, status: str):
    content = f"""
    <p>Hola <strong>{user_name}</strong>,</p>
    <p>Te notificamos que tu reciente pago por el monto de <strong class="highlight">₡{amount}</strong> ha sido <strong>{status}</strong>.</p>
    <p>Puedes verificar los detalles en tu historial de facturación.</p>
    """
    html = get_base_html(f"Estado de Pago: {status}", content)
    send_email_async(to_email, f"Estado de Pago: {status} - Momia TS", html)
