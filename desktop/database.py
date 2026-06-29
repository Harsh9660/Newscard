import sqlite3
import json
import os
import sys

def get_db_path():
    # Helper function to resolve paths relative to sys._MEIPASS for PyInstaller
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, "newscard_offline.db")

class DatabaseManager:
    def __init__(self):
        self.db_path = get_db_path()
        self.init_db()

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Customers Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_ref TEXT,
                    name TEXT,
                    address TEXT,
                    phone TEXT,
                    status TEXT
                )
            """)
            
            # Inventory Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_name TEXT,
                    unit_cost REAL,
                    class_type TEXT
                )
            """)
            
            # Delivery Rounds Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS delivery_rounds (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    route_title TEXT,
                    operation_shift TEXT
                )
            """)
            
            # Ledger Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ledger (
                    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER,
                    week_ending_date TEXT,
                    base_cost REAL,
                    amount_received REAL,
                    outstanding_balance REAL,
                    status_flag TEXT,
                    FOREIGN KEY(customer_id) REFERENCES customers(id)
                )
            """)
            
            # Vouchers Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS vouchers (
                    voucher_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER,
                    week_start TEXT,
                    notes TEXT,
                    duration_weeks INTEGER,
                    weekly_credit_value REAL,
                    FOREIGN KEY(customer_id) REFERENCES customers(id)
                )
            """)
            
            # Sync Queue Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sync_queue (
                    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT,
                    record_id INTEGER,
                    action_type TEXT,
                    payload_json TEXT,
                    synced_status INTEGER DEFAULT 0
                )
            """)
            conn.commit()

    def enqueue_sync(self, table_name, record_id, action_type, payload_dict):
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO sync_queue (table_name, record_id, action_type, payload_json, synced_status)
                    VALUES (?, ?, ?, ?, 0)
                """, (table_name, record_id, action_type, json.dumps(payload_dict)))
                conn.commit()
        except Exception as e:
            print(f"Error queuing sync event: {e}")

db = DatabaseManager()
