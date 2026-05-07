from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✓ Database connected successfullyjhgdtrhth")
except Exception as e:
    print(f"✗ Connection failed: {e}")