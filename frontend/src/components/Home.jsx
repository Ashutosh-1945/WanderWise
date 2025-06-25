import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Loading from "./Loading";

const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Home() {
  const [travelPlan, setTravelPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]); // No default center

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        let email = null;
        if (token) {
          const decoded = jwtDecode(token);
          email = decoded.email;
        }

        const response = await axios.get("http://localhost:3000/getplan", {
          params: { email },
        });

        if (response.data.data) {
          const fetchedTravelPlan = response.data.data;
          console.log(fetchedTravelPlan)    
          setTravelPlan(fetchedTravelPlan);
          setMapCenter([response.data.data.itinerary.day1[0].geoCoordinates.latitude, response.data.data.itinerary.day1[0].geoCoordinates.longitude])
          console.log(mapCenter)
        } else {
          console.log("No travel plan found in response");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;
  if (!travelPlan) return <div>No Travel Plan Available</div>; // Wait for center data

  return (
    <div className="ml-2 flex gap-5">
      <div className="w-full md:w-4/5 space-y-8">
        <h1 className="mt-3 mb-5 text-6xl font-bold">{travelPlan.tripDetails.destination}</h1>

        {Object.entries(travelPlan.itinerary).map(([day, places]) => (
          <div key={day} className="relative ml-3">

            <h3 className="text-3xl mb-3 font-semibold">DAY {day.charAt(day.length - 1)}</h3>
            <div className="relative space-y-8 ">

              {places.map((place, index) => (
                <div key={index} className="relative flex items-start gap-6">
                  <div className="flex items-center bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 w-full">
                    <img
                      src={place.placeImageUrl}
                      alt={place.placeName}
                      className="w-40 h-40 object-cover rounded-l-2xl"
                    />

                    <div className="flex flex-1 flex-col items-start p-4">
                      <h3 className="text-lg font-semibold ">{place.placeName}</h3>
                      <p className="text-gray-600">{place.placeDetails}</p>
                      <p className="text-gray-600">Ticket Price: {place.ticketPricing}</p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:flex md:w-[35%] sticky top-5 self-start h-[80vh] max-h-[80vh] overflow-hidden mr-4 mt-5">
  {mapCenter && (
    <MapContainer
      center={mapCenter}
      zoom={11}
      className="h-full w-full rounded-lg shadow-lg"
      style={{ minHeight: "100vh", minWidth: "100%" }} // Ensures full height & width
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {Object.entries(travelPlan.itinerary).map(([day, places]) =>
        places.map((place, index) => {
          const lat = place?.geoCoordinates?.latitude;
          const lng = place?.geoCoordinates?.longitude;

          if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
            console.warn(`Invalid coordinates for ${place.placeName}:`, lat, lng);
            return null;
          }

          return (
            <Marker key={index} position={[lat, lng]} icon={customIcon}>
              <Popup>
                <strong>{place.placeName}</strong>
                <p>{place.placeDetails}</p>
                <img
                  src={place.placeImageUrl}
                  alt={place.placeName}
                  className="w-24 h-auto rounded-md mt-2"
                />
              </Popup>
            </Marker>
          );
        })
      )}
    </MapContainer>
  )}
</div>

    </div>
  );
}

export default Home;
