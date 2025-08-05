import sqlite3
from datetime import datetime, timedelta
import math

def get_closest_departures(lat: float = None, lon: float = None, limit: int = 5) -> list:
    """
    Retrieves the closest upcoming departures based on geographic location.
    
    Args:
        lat (float): Latitude of the reference point (optional)
        lon (float): Longitude of the reference point (optional)
        limit (int): Maximum number of departures to return (default: 5)
    
    Returns:
        list: List of dictionaries containing departure information:
            - trip_id: Unique identifier of the trip
            - route_id: Identifier of the route
            - trip_headsign: Final destination of the trip
            - stop: Dictionary with stop information (id, name, coordinates, times)
            - distance_start_to_stop: Distance from trip start to current stop
            - debug_dist_stop_to_end: Distance from current stop to trip end
    """
    conn = None
    try:
        conn = sqlite3.connect("trips.sqlite")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get current time in HH:MM:SS format
        current_time = datetime.now().strftime("%H:%M:%S")
        
        query = """
            SELECT 
                s.stop_id, s.stop_name, s.stop_lat, s.stop_lon,
                st.arrival_time, st.departure_time,
                t.trip_id, t.route_id, t.trip_headsign,
                (st.shape_dist_traveled) as distance_start_to_stop,
                (SELECT MAX(shape_dist_traveled) FROM stop_times WHERE trip_id = t.trip_id) - st.shape_dist_traveled as distance_to_end
            FROM stops s
            JOIN stop_times st ON s.stop_id = st.stop_id
            JOIN trips t ON st.trip_id = t.trip_id
            WHERE st.departure_time > ?
        """
        
        params = [current_time]
        
        # If coordinates provided, add distance calculation and ordering
        if lat is not None and lon is not None:
            query += """
                ORDER BY (
                    (s.stop_lat - ?) * (s.stop_lat - ?) + 
                    (s.stop_lon - ?) * (s.stop_lon - ?)
                )
            """
            params.extend([lat, lat, lon, lon])
        
        query += f" LIMIT {limit}"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()

        departures = []
        for row in rows:
            departure = {
                "trip_id": row['trip_id'],
                "route_id": row['route_id'],
                "trip_headsign": row['trip_headsign'],
                "stop": {
                    "id": row['stop_id'],
                    "name": row['stop_name'],
                    "coordinates": {
                        "latitude": float(row['stop_lat']),
                        "longitude": float(row['stop_lon'])
                    },
                    "arrival_time": row['arrival_time'],
                    "departure_time": row['departure_time']
                },
                "distance_start_to_stop": float(row['distance_start_to_stop']),
                "debug_dist_stop_to_end": float(row['distance_to_end'])
            }
            departures.append(departure)

        return departures

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []
    finally:
        if conn:
            conn.close()