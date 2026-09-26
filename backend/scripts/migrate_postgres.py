from sqlalchemy import text
from app.database.connection import engine

def upgrade():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE train_cache ADD COLUMN stations JSON;"))
            conn.commit()
            print("Successfully added stations column to Postgres database.")
        except Exception as e:
            print("Error adding column:", e)

if __name__ == "__main__":
    upgrade()
