from flask import Blueprint, jsonify, request, abort
from datetime import datetime
import re

from public_transport_api.services.departures_service import (
    get_closest_departures,
)

departures_bp = Blueprint(
    'departures',
    __name__,
    url_prefix='/public_transport/city/<string:city>/closest_departures',
)


@departures_bp.route("/", methods=["GET"])
def closest_departures(city):
    """
    Get closest departures for public transport in a given city.

    Args:
        city (str): City name (currently only "wroclaw" supported)

    Query Parameters:
        start_coordinates (str): Comma-separated latitude,longitude (e.g. "51.1079,17.0385")
        end_coordinates (str): Comma-separated latitude,longitude
        start_time (str, optional): Time in HH:MM format (default: current time)
        limit (int, optional): Maximum number of results (default: 5)

    Returns:
        JSON response with departures list and metadata

    Raises:
        400: Bad Request - invalid parameters
        404: City not found
        500: Server error
    """
    # Validate city
    if city.lower() != "wroclaw":
        abort(404, description="Currently only Wroclaw city is supported")

    # Get and validate coordinates
    start_coords = request.args.get('start_coordinates')
    end_coords = request.args.get('end_coordinates')

    if not start_coords or not end_coords:
        abort(
            400,
            description="Both start_coordinates and end_coordinates are required",
        )

    # Validate coordinate format (latitude,longitude)
    coord_pattern = re.compile(r'^-?\d+\.?\d*,-?\d+\.?\d*$')
    if not coord_pattern.match(start_coords) or not coord_pattern.match(
        end_coords
    ):
        abort(
            400,
            description="Coordinates must be in format: latitude,longitude",
        )

    start_lat, start_lon = map(float, start_coords.split(','))
    end_lat, end_lon = map(float, end_coords.split(','))

    # Validate coordinates range
    if (
        not (-90 <= start_lat <= 90)
        or not (-180 <= start_lon <= 180)
        or not (-90 <= end_lat <= 90)
        or not (-180 <= end_lon <= 180)
    ):
        abort(400, description="Coordinates out of valid range")

    # Get and validate optional parameters
    try:
        limit = int(request.args.get('limit', 5))
        if limit < 1 or limit > 50:
            abort(400, description="Limit must be between 1 and 50")
    except ValueError:
        abort(400, description="Limit must be a valid integer")

    start_time = request.args.get(
        'start_time', datetime.now().strftime("%H:%M")
    )
    if not re.match(r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', start_time):
        abort(400, description="Start time must be in HH:MM format")

    try:
        departures = get_closest_departures(
            lat=start_lat,
            lon=start_lon,
            limit=limit,
        )

        response = {
            "metadata": {
                "city": city,
                "start_coordinates": {
                    "latitude": start_lat,
                    "longitude": start_lon,
                },
                "end_coordinates": {"latitude": end_lat, "longitude": end_lon},
                "start_time": start_time,
                "limit": limit,
            },
            "departures": departures,
        }

        return jsonify(response)

    except Exception as e:
        print(f"Error fetching departures: {e}")
        # abort(500, description=str(e))
