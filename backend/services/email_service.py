import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@momiats.com")

def send_email_sync(to_email: str, subject: str, body: str, is_html: bool = True):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"Skipping email to {to_email} because SMTP credentials are not configured.")
        return

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    
    if is_html:
        msg.add_alternative(body, subtype='html')
    else:
        msg.set_content(body)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

# Email Templates
def send_workout_assigned_email(to_email: str, athlete_name: str, workout_title: str, date: str):
    subject = "Nuevo Entrenamiento Asignado - MOMIA TS"
    body = f"""
    <html>
        <body>
            <h2>Hola {athlete_name},</h2>
            <p>Tu entrenador te ha asignado una nueva rutina de entrenamiento:</p>
            <h3>{workout_title}</h3>
            <p><strong>Fecha programada:</strong> {date}</p>
            <p>¡Prepárate y da lo mejor de ti!</p>
            <br>
            <p>Saludos,<br>El equipo de MOMIA TS</p>
        </body>
    </html>
    """
    send_email_sync(to_email, subject, body)

def send_payment_status_email(to_email: str, user_name: str, amount: str, status: str):
    subject = f"Estado de Pago: {status} - MOMIA TS"
    body = f"""
    <html>
        <body>
            <h2>Hola {user_name},</h2>
            <p>Te notificamos que tu reciente pago por el monto de <strong>{amount}</strong> ha sido <strong>{status}</strong>.</p>
            <p>Puedes verificar los detalles en tu historial de facturación.</p>
            <br>
            <p>Saludos,<br>El equipo de MOMIA TS</p>
        </body>
    </html>
    """
    send_email_sync(to_email, subject, body)

def send_event_registration_email(to_email: str, user_name: str, event_title: str):
    subject = "Registro a Evento Confirmado - MOMIA TS"
    body = f"""
    <html>
        <body>
            <h2>Hola {user_name},</h2>
            <p>Te has registrado exitosamente al evento:</p>
            <h3>{event_title}</h3>
            <p>Nos vemos en la línea de salida. Sigue entrenando duro.</p>
            <br>
            <p>Saludos,<br>El equipo de MOMIA TS</p>
        </body>
    </html>
    """
    send_email_sync(to_email, subject, body)
