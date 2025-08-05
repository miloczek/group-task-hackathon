import sqlite3
from typing import Optional, Dict, List


def get_trip_details(trip_id: str) -> Optional[Dict]:
    """
    Retrieves detailed information about a specific trip including all its stops.

    Args:
        trip_id (str): The unique identifier of the trip

    Returns:
        Optional[Dict]: A dictionary containing trip details and its stops:
            - trip_id: Unique identifier of the trip
            - route_id: Identifier of the route
            - trip_headsign: Final destination of the trip
            - stops: List of dictionaries containing stop information:
                - name: Name of the stop
                - coordinates: Dictionary with latitude and longitude
                - arrival_time: Scheduled arrival time at the stop
                - departure_time: Scheduled departure time from the stop
        Returns None if trip is not found.
    """
    conn = None
    try:
        conn = sqlite3.connect('database.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get trip basic information
        cursor.execute("""
            SELECT route_id, trip_headsign 
            FROM trips 
            WHERE trip_id = ?
        """, (trip_id,))
        trip_row = cursor.fetchone()

        if not trip_row:
            return None

        # Get all stops for this trip ordered by stop sequence
        cursor.execute("""
            SELECT 
                s.stop_name as name,
                s.stop_lat as latitude,
                s.stop_lon as longitude,
                st.arrival_time,
                st.departure_time
            FROM stops s
            JOIN stop_times st ON s.stop_id = st.stop_id
            WHERE st.trip_id = ?
            ORDER BY st.stop_sequence
        """, (trip_id,))
        
        stops = []
        for stop in cursor.fetchall():
            stops.append({
                "name": stop['name'],
                "coordinates": {
                    "latitude": float(stop['latitude']),
                    "longitude": float(stop['longitude'])
                },
                "arrival_time": stop['arrival_time'],
                "departure_time": stop['departure_time']
            })

        return {
            "trip_id": trip_id,
            "route_id": trip_row['route_id'],
            "trip_headsign": trip_row['trip_headsign'],
            "stops": stops
        }

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None
    finally:
        if conn:
            conn.close()