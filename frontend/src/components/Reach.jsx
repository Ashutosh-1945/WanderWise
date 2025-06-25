import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";

function Reach() {
    const apiKey = "wKvwyvBZLr2wfVcKKH0FJJqfydUxbrKzn34xh7kH";
    const mapRef = useRef(null);
    const routingControlRef = useRef(null);
    const [source, setSource] = useState("");
    const [destination, setDestination] = useState("");
    const [error, setError] = useState(null);
    const [user, setUser] = useState("");
    const [distance, setDistance] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            const decoded = jwtDecode(token);
            setUser(decoded.email);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!source.trim() || !destination.trim()) {
            setError("Source and destination are required.");
            return;
        }

        try {
            const [res1, res2] = await Promise.all([
                axios.get(`https://api.olamaps.io/places/v1/geocode`, {
                    params: { address: source, language: "English", api_key: apiKey }
                }),
                axios.get(`https://api.olamaps.io/places/v1/geocode`, {
                    params: { address: destination, language: "English", api_key: apiKey }
                })
            ]);

            const sourceCoords = { lat: res1.data.geocodingResults[0].geometry.location.lat, lng: res1.data.geocodingResults[0].geometry.location.lng };
            const destCoords = { lat: res2.data.geocodingResults[0].geometry.location.lat, lng: res2.data.geocodingResults[0].geometry.location.lng };
            const centre = [(sourceCoords.lat + destCoords.lat) / 2, (destCoords.lng + sourceCoords.lng) / 2];

            if (!mapRef.current) {
                mapRef.current = L.map("map").setView(centre, 6);

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
                }).addTo(mapRef.current);
            }

            if (routingControlRef.current) {
                mapRef.current.removeControl(routingControlRef.current);
            }

            L.marker([sourceCoords.lat, sourceCoords.lng]).addTo(mapRef.current).bindPopup("Source").openPopup();
            L.marker([destCoords.lat, destCoords.lng]).addTo(mapRef.current).bindPopup("Destination");

            routingControlRef.current = L.Routing.control({
                waypoints: [L.latLng(sourceCoords.lat, sourceCoords.lng), L.latLng(destCoords.lat, destCoords.lng)],
                routeWhileDragging: true,
                lineOptions: { styles: [{ color: "blue", weight: 5 }] },
                router: L.Routing.osrmv1({
                    serviceUrl: "https://router.project-osrm.org/route/v1",
                }),
            }).addTo(mapRef.current);

            routingControlRef.current.on("routesfound", function (event) {
                const route = event.routes[0];
                const routeDistance = (route.summary.totalDistance / 1000).toFixed(2);
                setDistance(routeDistance);
            });

            const directionsContainer = document.querySelector(".leaflet-routing-container");
            if (directionsContainer) {
                directionsContainer.classList.add("bg-white", "p-4", "rounded-lg", "shadow-lg", "max-h-[300px]", "overflow-y-auto", "bg-opacity-80");
            }

        } catch (err) {
            console.error("Error fetching coordinates:", err);
            setError("Failed to fetch location data. Check input.");
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 mt-8">
            {/* FORM SECTION (30%) */}
            <div className="ml-4 mt-4 w-full md:w-1/3 bg-white p-6 shadow-lg rounded-lg">
                <p className="text-4xl font-bold">Route</p>
                <form onSubmit={handleSubmit}>
                    <div className="mt-6">
                        <label className="block text-gray-700 text-lg font-bold mb-2">Source:</label>
                        <input
                            className="text-gray-700 border border-gray-300 rounded py-2 px-4 block w-full focus:outline-blue-700"
                            type="text"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-6">
                        <label className="block text-gray-700 text-lg font-bold mb-2">Destination:</label>
                        <input
                            className="text-gray-700 border border-gray-300 rounded py-2 px-4 block w-full focus:outline-blue-700"
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-8">
                        <button type="submit" className="bg-blue-700 text-white font-bold py-2 px-4 w-full rounded hover:bg-blue-600">
                            Find Route
                        </button>
                    </div>
                </form>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {distance && <p className="mt-4 text-lg font-semibold">🚗 Distance: {distance} km</p>}
            </div>

            {/* MAP SECTION (70%) */}
            <div className="mr-4 mt-4 w-full md:w-2/3 h-[80vh] rounded-lg shadow-lg overflow-hidden relative">
                <div id="map" className="h-full w-full"></div>
            </div>
        </div>
    );
}

export default Reach;