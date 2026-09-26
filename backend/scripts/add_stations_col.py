import sqlite3

conn = sqlite3.connect(r'c:\Projects\sih26\backend\app.db')
c = conn.cursor()
try:
    c.execute('ALTER TABLE train_cache ADD COLUMN stations JSON;')
    print("Column added")
except Exception as e:
    print("Error:", e)
conn.commit()
conn.close()
