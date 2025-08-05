class TransportApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5001';
        this.map = null;
        this.startMarker = null;
        this.endMarker = null;
        this.startCoords = null;
        this.endCoords = null;
        this.stopMarkers = [];
        this.routeLayer = null;

        console.log('TransportApp initializing...');
        this.initializeApp();
        this.setupEventListeners();
        this.setupExistingApiCaller();
    }

    initializeApp() {
        console.log('Initializing app...');
        this.initMap();
        this.setDefaultDepartureTime();
        console.log('App initialized successfully');
    }

    initMap() {
        console.log('Initializing map...');
        try {
            // Initialize map centered on Wrocław
            this.map = L.map('map').setView([51.1079, 17.0385], 13);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Handle map clicks
            this.map.on('click', (e) => {
                console.log('Map clicked at:', e.latlng);
                this.handleMapClick(e.latlng);
            });

            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize map:', error);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        const searchBtn = document.getElementById('search-btn');
        const clearBtn = document.getElementById('clear-btn');
        const departureTime = document.getElementById('departure-time');
        const limit = document.getElementById('limit');

        // Check if elements exist
        console.log('Elements found:', {
            searchBtn: !!searchBtn,
            clearBtn: !!clearBtn,
            departureTime: !!departureTime,
            limit: !!limit
        });

        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                console.log('Search button clicked!');
                e.preventDefault();
                this.searchDepartures();
            });
        } else {
            console.error('Search button not found!');
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                console.log('Clear button clicked!');
                e.preventDefault();
                this.clearAll();
            });
        }

        if (departureTime) {
            departureTime.addEventListener('change', () => {
                console.log('Departure time changed:', departureTime.value);
                this.updateSearchButton();
            });
        }

        if (limit) {
            limit.addEventListener('change', () => {
                console.log('Limit changed:', limit.value);
                this.updateSearchButton();
            });
        }
    }

    setupExistingApiCaller() {
        console.log('Setting up existing API caller...');
        // Keep your existing API caller functionality
        const apiEndpointSelector = document.getElementById('api-endpoint-selector');
        const callApiButton = document.getElementById('call-api-btn');
        const jsonOutputTextarea = document.getElementById('json-output');
        const statusMessageDiv = document.getElementById('status-message');

        if (!callApiButton) {
            console.log('API caller elements not found, skipping setup');
            return;
        }

        callApiButton.addEventListener('click', async () => {
            const apiUrl = apiEndpointSelector.value.trim();

            if (!apiUrl) {
                this.displayStatus('Please select an API endpoint.', 'text-red-600');
                return;
            }

            jsonOutputTextarea.value = '';
            this.displayStatus('Calling API...', 'text-blue-600');
            callApiButton.disabled = true;

            try {
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.message) {
                            errorMessage += ` - ${errorData.message}`;
                        } else {
                            errorMessage += ` - ${JSON.stringify(errorData)}`;
                        }
                    } catch (parseError) {
                        // Use default error message
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                jsonOutputTextarea.value = JSON.stringify(data, null, 2);
                this.displayStatus('API call successful!', 'text-green-600');

            } catch (error) {
                console.error("Failed to call API:", error);
                jsonOutputTextarea.value = `Error: ${error.message}`;
                this.displayStatus(`Error calling API: ${error.message}`, 'text-red-600');
            } finally {
                callApiButton.disabled = false;
            }
        });
    }

    displayStatus(message, colorClass) {
        const statusMessageDiv = document.getElementById('status-message');
        if (statusMessageDiv) {
            statusMessageDiv.textContent = message;
            statusMessageDiv.className = `mb-4 text-center text-sm font-semibold ${colorClass}`;
        }
    }

    setDefaultDepartureTime() {
        const departureTimeInput = document.getElementById('departure-time');
        if (departureTimeInput) {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            departureTimeInput.value = localDateTime;
            console.log('Default departure time set:', localDateTime);
        }
    }

    handleMapClick(latlng) {
        console.log('Handling map click at:', latlng);

        if (!this.startCoords) {
            console.log('Setting start point');
            this.setStartPoint(latlng);
        } else if (!this.endCoords) {
            console.log('Setting end point');
            this.setEndPoint(latlng);
        } else {
            // If both are set, replace start point
            console.log('Both points set, replacing start point');
            this.clearSelection();
            this.setStartPoint(latlng);
        }
    }

    setStartPoint(latlng) {
        this.startCoords = latlng;
        console.log('Start coordinates set:', this.startCoords);

        if (this.startMarker) {
            this.map.removeLayer(this.startMarker);
        }

        this.startMarker = L.marker(latlng, {
            icon: this.createIcon('🟢', 'start-marker')
        }).addTo(this.map);

        this.startMarker.bindPopup('Start Point').openPopup();
        this.updateCoordinatesDisplay();
        this.updateSearchButton();
    }

    setEndPoint(latlng) {
        this.endCoords = latlng;
        console.log('End coordinates set:', this.endCoords);

        if (this.endMarker) {
            this.map.removeLayer(this.endMarker);
        }

        this.endMarker = L.marker(latlng, {
            icon: this.createIcon('🔴', 'end-marker')
        }).addTo(this.map);

        this.endMarker.bindPopup('Destination Point').openPopup();
        this.updateCoordinatesDisplay();
        this.updateSearchButton();
    }

    createIcon(emoji, className) {
        return L.divIcon({
            html: `<div class="${className}">${emoji}</div>`,
            className: 'custom-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    updateCoordinatesDisplay() {
        const display = document.getElementById('coordinates-display');
        if (!display) return;

        if (this.startCoords && this.endCoords) {
            display.innerHTML = `
                <div>
                    <strong>Start:</strong> ${this.startCoords.lat.toFixed(4)}, ${this.startCoords.lng.toFixed(4)}<br>
                    <strong>Destination:</strong> ${this.endCoords.lat.toFixed(4)}, ${this.endCoords.lng.toFixed(4)}
                </div>
            `;
        } else if (this.startCoords) {
            display.innerHTML = `
                <div>
                    <strong>Start:</strong> ${this.startCoords.lat.toFixed(4)}, ${this.startCoords.lng.toFixed(4)}<br>
                    <em>Click on the map to select destination</em>
                </div>
            `;
        } else {
            display.innerHTML = '<em>Click on the map to select start point</em>';
        }
    }

    updateSearchButton() {
        const searchBtn = document.getElementById('search-btn');
        const departureTimeInput = document.getElementById('departure-time');

        if (!searchBtn || !departureTimeInput) {
            console.log('Missing elements for button update');
            return;
        }

        const hasValidSelection = this.startCoords && this.endCoords;
        const hasTime = departureTimeInput.value;

        console.log('Button update check:', {
            hasValidSelection,
            hasTime: !!hasTime,
            startCoords: this.startCoords,
            endCoords: this.endCoords
        });

        const shouldEnable = hasValidSelection && hasTime;
        searchBtn.disabled = !shouldEnable;

        console.log('Search button disabled:', searchBtn.disabled);
    }

    async searchDepartures() {
        console.log('searchDepartures called');

        if (!this.startCoords || !this.endCoords) {
            console.error('Missing coordinates');
            this.showError('Please select start and end points on the map');
            return;
        }

        const departureTimeInput = document.getElementById('departure-time');
        const limitInput = document.getElementById('limit');

        if (!departureTimeInput || !limitInput) {
            console.error('Missing form inputs');
            this.showError('Form elements not found');
            return;
        }

        const startTime = departureTimeInput.value;
        const limit = parseInt(limitInput.value);

        console.log('Search parameters:', {
            startCoords: this.startCoords,
            endCoords: this.endCoords,
            startTime,
            limit
        });

        this.showLoading();
        this.clearStopMarkers();

        try {
            // Convert datetime-local to HH:MM format
            const startDateTime = new Date(startTime);
            const hours = startDateTime.getHours().toString().padStart(2, '0');
            const minutes = startDateTime.getMinutes().toString().padStart(2, '0');
            const timeInHHMM = `${hours}:${minutes}`;

            console.log('Time conversion:', {
                original: startTime,
                parsed: startDateTime,
                formatted: timeInHHMM
            });

            const params = new URLSearchParams({
                start_coordinates: `${this.startCoords.lat},${this.startCoords.lng}`,
                end_coordinates: `${this.endCoords.lat},${this.endCoords.lng}`,
                start_time: timeInHHMM, // Changed from ISO to HH:MM format
                limit: limit
            });

            const url = `${this.apiBaseUrl}/public_transport/city/wroclaw/closest_departures?${params}`;
            console.log('API URL:', url);
            console.log('Parameters:', {
                start_coordinates: `${this.startCoords.lat},${this.startCoords.lng}`,
                end_coordinates: `${this.endCoords.lat},${this.endCoords.lng}`,
                start_time: timeInHHMM,
                limit: limit
            });

            const response = await fetch(url);
            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            this.displayResults(data);

            if (data.departures && data.departures.length > 0) {
                this.displayStopsOnMap(data.departures);
            }

        } catch (error) {
            console.error('Search error:', error);
            this.showError(`Failed to fetch departures: ${error.message}`);
        }
    }

    showLoading() {
        const resultsContainer = document.getElementById('departures-list');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="loading">
                    <p>🔄 Searching for departures...</p>
                </div>
            `;
        }
    }

    displayResults(response) {
        const resultsContainer = document.getElementById('departures-list');
        if (!resultsContainer) return;

        console.log('Displaying results:', response);

        if (!response.departures || response.departures.length === 0) {
            resultsContainer.innerHTML = `
                <div class="error">
                    <p>No departures found for the selected criteria.</p>
                    <p>Try selecting different points or adjusting the time.</p>
                </div>
            `;
            return;
        }

        let html = `<h4 class="font-semibold text-gray-800 mb-3">Found ${response.departures.length} departures:</h4>`;

        response.departures.forEach((departure, index) => {
            const departureTime = new Date(departure.stop.departure_time);
            const arrivalTime = new Date(departure.stop.arrival_time);

            html += `
                <div class="departure-item">
                    <h4>🚏 ${departure.stop.name}</h4>
                    <div class="departure-info">
                        <strong>Line:</strong>
                        <span>${departure.route_id}</span>
                        
                        <strong>To:</strong>
                        <span>${departure.trip_headsign}</span>
                        
                        <strong>Departure:</strong>
                        <span>${departureTime.toLocaleTimeString()}</span>
                    </div>
                    <button onclick="app.showRoute('${departure.trip_id}')" class="route-btn">
                        Show Full Route
                    </button>
                </div>
            `;
        });

        resultsContainer.innerHTML = html;
    }

    displayStopsOnMap(departures) {
        console.log('Displaying stops on map:', departures.length);

        departures.forEach((departure, index) => {
            try {
                const coords = [departure.stop.coordinates.latitude, departure.stop.coordinates.longitude];
                console.log(`Adding stop marker ${index}:`, coords);

                const marker = L.marker(coords, {
                    icon: this.createIcon('🚏', 'stop-marker')
                }).addTo(this.map);

                this.stopMarkers.push(marker);

                const popupContent = `
                    <div class="stop-popup">
                        <h4>${departure.stop.name}</h4>
                        <p><strong>Line:</strong> ${departure.route_id}</p>
                        <p><strong>To:</strong> ${departure.trip_headsign}</p>
                        <p><strong>Departure:</strong> ${new Date(departure.stop.departure_time).toLocaleTimeString()}</p>
                        <button onclick="app.showRoute('${departure.trip_id}')" class="route-btn">Show Route</button>
                    </div>
                `;

                marker.bindPopup(popupContent);
            } catch (error) {
                console.error('Error adding stop marker:', error, departure);
            }
        });
    }

    async showRoute(tripId) {
        console.log('Showing route for trip:', tripId);

        try {
            const url = `${this.apiBaseUrl}/public_transport/city/wroclaw/trip/${tripId}`;
            console.log('Route API URL:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Route data:', data);

            this.displayRouteOnMap(data.trip_details);

        } catch (error) {
            console.error('Route error:', error);
            this.showError('Failed to fetch route details: ' + error.message);
        }
    }

    displayRouteOnMap(tripDetails) {
        console.log('Displaying route on map:', tripDetails);

        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }

        const coordinates = tripDetails.stops.map(stop => [
            stop.coordinates.latitude,
            stop.coordinates.longitude
        ]);

        this.routeLayer = L.polyline(coordinates, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.7
        }).addTo(this.map);

        // Add stop markers along the route
        tripDetails.stops.forEach((stop, index) => {
            const marker = L.circleMarker([stop.coordinates.latitude, stop.coordinates.longitude], {
                radius: 6,
                fillColor: '#3b82f6',
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.routeLayer);

            marker.bindPopup(`
                <div>
                    <strong>${stop.name}</strong><br>
                    Arrival: ${new Date(stop.arrival_time).toLocaleTimeString()}<br>
                    Departure: ${new Date(stop.departure_time).toLocaleTimeString()}
                </div>
            `);
        });

        this.map.fitBounds(this.routeLayer.getBounds());
    }

    clearStopMarkers() {
        console.log('Clearing stop markers:', this.stopMarkers.length);
        this.stopMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.stopMarkers = [];
    }

    clearSelection() {
        console.log('Clearing selection');

        if (this.startMarker) {
            this.map.removeLayer(this.startMarker);
            this.startMarker = null;
        }
        if (this.endMarker) {
            this.map.removeLayer(this.endMarker);
            this.endMarker = null;
        }
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }

        this.startCoords = null;
        this.endCoords = null;
        this.updateCoordinatesDisplay();
        this.updateSearchButton();
    }

    clearAll() {
        console.log('Clearing all');
        this.clearSelection();
        this.clearStopMarkers();
        const resultsContainer = document.getElementById('departures-list');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="text-gray-600">Select start and destination points on the map</p>';
        }
        this.setDefaultDepartureTime();
    }

    showError(message) {
        console.error('Showing error:', message);
        const resultsContainer = document.getElementById('departures-list');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error">
                    <p>❌ ${message}</p>
                </div>
            `;
        }
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    app = new TransportApp();

    // Make app globally available for debugging
    window.transportApp = app;
    console.log('App available globally as window.transportApp');
});