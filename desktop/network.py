import threading
import time
import urllib.request
import urllib.error
import json
from database import db

class SyncDaemon:
    def __init__(self, api_url="https://api.newscard-saas.com/v1/sync"):
        self.api_url = api_url
        self.running = False
        self.thread = None

    def start(self):
        if self.running: return
        self.running = True
        self.thread = threading.Thread(target=self.sync_loop, daemon=True)
        self.thread.start()
        print("Background Sync Daemon started.")

    def stop(self):
        self.running = False

    def sync_loop(self):
        while self.running:
            try:
                self._process_sync_queue()
            except Exception as e:
                print(f"Sync error: {e}")
            time.sleep(60)

    def _check_connection(self):
        try:
            urllib.request.urlopen("https://8.8.8.8", timeout=3)
            return True
        except urllib.error.URLError:
            return False

    def _process_sync_queue(self):
        # We assume internet connection check is handled or we just try POSTing
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT event_id, table_name, record_id, action_type, payload_json FROM sync_queue WHERE synced_status = 0")
            rows = cursor.fetchall()
            
            if not rows:
                return

            payloads = []
            for row in rows:
                payloads.append({
                    "event_id": row[0],
                    "table_name": row[1],
                    "record_id": row[2],
                    "action_type": row[3],
                    "payload_json": json.loads(row[4])
                })

            req = urllib.request.Request(self.api_url, data=json.dumps(payloads).encode('utf-8'), headers={'Content-Type': 'application/json'})
            
            try:
                # Fire network request to SaaS endpoint
                response = urllib.request.urlopen(req, timeout=5)
                if response.getcode() == 200:
                    # Mark all as synced
                    event_ids = [r[0] for r in rows]
                    placeholders = ",".join(["?"] * len(event_ids))
                    cursor.execute(f"UPDATE sync_queue SET synced_status = 1 WHERE event_id IN ({placeholders})", event_ids)
                    conn.commit()
                    print(f"Successfully synced {len(event_ids)} records to cloud.")
            except urllib.error.URLError:
                print("Sync failed: Cloud endpoint unreachable or network down.")

sync_daemon = SyncDaemon()
