# run once — one-time migration script
import bcrypt
from database import SessionLocal
from models.user import User

db = SessionLocal()
users = db.query(User).all()
for user in users:
    if not user.password_hash.startswith("$2b$"):  # skip already hashed
        hashed = bcrypt.hashpw(user.password_hash.encode(), bcrypt.gensalt()).decode()
        user.password_hash = hashed
db.commit()
db.close()
print("Done")