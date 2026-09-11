import sqlite3

def run():
    try:
        conn = sqlite3.connect('app.db')
        conn.execute("ALTER TABLE prediction_history ADD COLUMN train_name VARCHAR(150) DEFAULT '';")
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print("Migration error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    run()
