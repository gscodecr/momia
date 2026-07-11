import requests
import sqlite3

# 1. Inspect the database directly
conn = sqlite3.connect("momia.db")
c = conn.cursor()
c.execute("SELECT * FROM workouts")
rows = c.fetchall()
print("Workouts in DB:", len(rows))
for r in rows:
    print(r)

# 2. Check if the server is throwing 500 for get_workouts
