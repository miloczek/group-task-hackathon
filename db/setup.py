import pandas as pd
import sqlite3


conn = sqlite3.connect("database.db")
stop_times = pd.read_csv("data/stop_times.txt")
stops = pd.read_csv("data/stops.txt")
trips = pd.read_csv("data/trips.txt")

# Create SQLite DB and upload tablesaa
stop_times.to_sql("stop_times", conn, if_exists="replace", index=False)
stops.to_sql("stops", conn, if_exists="replace", index=False)
trips.to_sql("trips", conn, if_exists="replace", index=False)

# Example SQL query
conn.close()