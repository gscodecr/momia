import models
from database import engine

models.Base.metadata.create_all(bind=engine)
print("Orders table created successfully.")
