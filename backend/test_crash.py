import requests

# Let's try to login and get the workouts to see the 500 error!
r_login = requests.post("http://127.0.0.1:8001/auth/login", data={"username":"gerardo@gscodecr.com", "password":"231287"})
token = r_login.json().get("access_token")

r_workouts = requests.get("http://127.0.0.1:8001/workouts/", headers={"Authorization": f"Bearer {token}"})
print(r_workouts.status_code)
print(r_workouts.text)
