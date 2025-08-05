from flask import Blueprint, jsonify, abort, request

from public_transport_api.services.trips_service import get_trip_details

trips_bp = Blueprint('trips', __name__, url_prefix='/public_transport/city/<string:city>/trip')

@trips_bp.route("/<string:trip_id>", methods=["GET"])
def handle_trip_details(city, trip_id):
    """
    Retrieves details about a specific trip, including its route, headsign, and stop details.

    Args:
        city (str): City name (currently only "wroclaw" supported)
        trip_id (str): Unique identifier of the trip
        
    Returns:
        JSON response with trip details and metadata
        
    Raises:
        400: Bad Request - invalid city
        404: Trip not found
    """
    # Validate city
    if city.lower() != "wroclaw":
        abort(400, description="Currently only Wroclaw city is supported")

    # Get trip details
    trip_details = get_trip_details(trip_id)
    if not trip_details:
        abort(404, description=f"Trip with id {trip_id} not found")

    # Prepare response with metadata
    response = {
        "metadata": {
            "self": request.path,
            "city": city,
            "trip_id": trip_id
        },
        "trip_details": trip_details
    }

    return jsonify(response)