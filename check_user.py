import sys
sys.path.append('backend')
from backend import database, models
db = database.SessionLocal()
user = db.query(models.User).filter(models.User.email == "eddyngerardo@gmail.com").first()
if user:
    print(f"User: {user.email}")
    print(f"Sub Type: {user.subscription_type}")
    print(f"Sub Status: {user.subscription_status}")
    print(f"Next Payment: {user.next_payment_date}")
else:
    print("User not found")
