import os
import sys
import argparse
from sqlalchemy.orm import Session

# Add the parent directory to the path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.connection import SessionLocal, engine
from app.models import Base
from app.models.user import User
from app.core.security import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)

def create_admin(email: str, password: str):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User with email {email} already exists.")
            return

        admin_user = User(
            email=email,
            password_hash=get_password_hash(password),
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print(f"Successfully created ADMIN user: {email}")
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create an initial ADMIN user.")
    parser.add_argument("--email", required=True, help="Email address for the admin user")
    parser.add_argument("--password", required=True, help="Password for the admin user")
    
    args = parser.parse_args()
    
    init_db()
    create_admin(args.email, args.password)
