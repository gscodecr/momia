import requests
import sqlite3
import security

# Create athlete if not exists
conn = sqlite3.connect("momia.db")
c = conn.cursor()
c.execute("SELECT id FROM roles WHERE name='athlete'")
role_row = c.fetchone()
if not role_row:
    c.execute("INSERT INTO roles (name, permissions) VALUES ('athlete', 'read_workouts')")
    conn.commit()
    role_id = c.lastrowid
else:
    role_id = role_row[0]

c.execute("SELECT id FROM users WHERE email='athlete@test.com'")
user_row = c.fetchone()
if not user_row:
    pwd = security.get_password_hash("test")
    c.execute("INSERT INTO users (email, hashed_password, first_name, last_name, is_active, is_approved, role_id) VALUES ('athlete@test.com', ?, 'Test', 'Athlete', 1, 1, ?)", (pwd, role_id))
    conn.commit()

# Now login as athlete
r_login = requests.post("http://127.0.0.1:8001/auth/login", data={"username":"athlete@test.com", "password":"test"})
token = r_login.json().get("access_token")

r_workouts = requests.get("http://127.0.0.1:8001/workouts/", headers={"Authorization": f"Bearer {token}"})
print(r_workouts.status_code)
print(r_workouts.text)
