import sqlite3
import json
import os
from datetime import datetime

class LocalDB:
    def __init__(self, db_path="client_buffer.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        # Queue for pending uploads
        c.execute('''CREATE TABLE IF NOT EXISTS pending_events
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      event_type TEXT,
                      payload TEXT, 
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        conn.commit()
        conn.close()

    def add_event(self, event_type, payload):
        """Save failed event to local DB"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT INTO pending_events (event_type, payload) VALUES (?, ?)",
                  (event_type, json.dumps(payload)))
        conn.commit()
        conn.close()
        print(f"💾 Saved offline event: {event_type}")

    def pop_events(self, limit=10):
        """Get oldest events to sync"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM pending_events ORDER BY id ASC LIMIT ?", (limit,))
        rows = c.fetchall()
        
        events = []
        for row in rows:
            events.append({
                "id": row["id"],
                "event_type": row["event_type"],
                "payload": json.loads(row["payload"])
            })
        conn.close()
        return events

    def ack_events(self, event_ids):
        """Delete synced events"""
        if not event_ids: return
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        placeholders = ','.join(['?'] * len(event_ids))
        c.execute(f"DELETE FROM pending_events WHERE id IN ({placeholders})", event_ids)
        conn.commit()
        conn.close()
        print(f"☁️ Synced {len(event_ids)} events.")
