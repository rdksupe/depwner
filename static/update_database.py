#!/usr/bin/env python3

import sqlite3
import argparse
import sys
from datetime import datetime

def update_database(db_path, feed_path):
    """
    Updates the SQLite database with new malware definitions from a feed file.
    """
    new_hashes_count = 0
    try:
        # Read MD5 hashes from the feed file
        with open(feed_path, 'r') as f:
            feed_hashes = [line.strip() for line in f if not line.startswith('#') and line.strip()]
    except FileNotFoundError:
        print(f"Error: Feed file not found at {feed_path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading feed file {feed_path}: {e}", file=sys.stderr)
        sys.exit(1)

    if not feed_hashes:
        print("No valid hashes found in the feed file.")
        sys.exit(0)

    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Create table if it doesn't exist (for robustness)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS malware_hashes (
            md5_hash TEXT PRIMARY KEY,
            first_seen_utc TEXT,
            signature TEXT
        )
        """)
        conn.commit()

        for md5_hash in feed_hashes:
            if not isinstance(md5_hash, str) or len(md5_hash) != 32 or not all(c in '0123456789abcdefABCDEF' for c in md5_hash):
                print(f"Skipping invalid MD5 hash: {md5_hash}", file=sys.stderr)
                continue

            try:
                cursor.execute("SELECT 1 FROM malware_hashes WHERE md5_hash = ?", (md5_hash,))
                exists = cursor.fetchone()

                if not exists:
                    current_utc_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                    signature = 'MalwareBazaar_Recent'
                    
                    cursor.execute("""
                    INSERT INTO malware_hashes (md5_hash, first_seen_utc, signature)
                    VALUES (?, ?, ?)
                    """, (md5_hash, current_utc_time, signature))
                    conn.commit()
                    new_hashes_count += 1
            except sqlite3.IntegrityError:
                # This can happen if another process inserted the hash in the meantime,
                # or if the PRIMARY KEY constraint is violated for other reasons.
                print(f"Warning: IntegrityError for hash {md5_hash}. It might already exist or there's a data issue.", file=sys.stderr)
            except sqlite3.Error as db_err:
                print(f"Database error for hash {md5_hash}: {db_err}", file=sys.stderr)
                # Decide if you want to continue or exit for other DB errors

        print(f"Added {new_hashes_count} new malware definitions.")

    except sqlite3.Error as e:
        print(f"Error connecting to or operating on database {db_path}: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update malware definitions in an SQLite database.")
    parser.add_argument("db_path", help="Path to the SQLite database file.")
    parser.add_argument("feed_path", help="Path to the feed data file (one MD5 hash per line).")

    args = parser.parse_args()

    update_database(args.db_path, args.feed_path)
