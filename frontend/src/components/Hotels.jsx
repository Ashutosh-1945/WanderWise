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

function Weather() {
    const [Hotels, setHotels] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          let email = null;
          if (token) {
            const decoded = jwtDecode(token);
            email = decoded.email;
          }
  
          const response = await axios.get("https://wanderwise-4.onrender.com/getHotels", {
            params: { email },
          });
          console.log(response.data.data)
          if(response.data.data){
            const hotelList = response.data.data;
            setHotels(hotelList);
            setMapCenter([hotelList.hotels[0].geoCoordinates.latitude, hotelList.hotels[0].geoCoordinates.longitude ])
            console.log(mapCenter);
          }
          else{
            console.log("No list");
          }

        } catch (err) {
          console.error("Error fetching data:", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);
  
    if (loading) return <Loading />
    if (!Hotels) return <div>No Hotels Available</div>;


    return (
      <div className="ml-2 flex gap-5">
        {/* Hotels & Restaurants Section */}
        <div className="w-full md:w-[70%] space-y-10"> 
          <h1 className="mt-3 mb-5 text-6xl font-bold">Hotels & Restaurants</h1>
    
          {/* Hotels Section */}
          <div>
            <h2 className="text-3xl font-semibold mb-4">Hotels</h2>
            <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
              {Hotels.hotels.map((hotel, index) => (
                <div
                  key={index}
                  className="min-w-[250px] border rounded-lg shadow-md overflow-hidden bg-white"
                >
                  <img
                    src={hotel.hotelImageURL}
                    alt={hotel.hotelName}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3 text-center">
                    <h3 className="text-lg font-semibold">{hotel.hotelName}</h3>
                    <p className="text-gray-600">{hotel.address}</p>
                    <p className="text-yellow-500">{hotel.StarRating} ⭐</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
    
          {/* Restaurants Section */}
          <div>
            <h2 className="text-3xl font-semibold mb-4">Restaurants</h2>
            <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
              {Hotels.restaurants.map((restaurant, index) => (
                <div
                  key={index}
                  className="min-w-[250px] border rounded-lg shadow-md overflow-hidden bg-white"
                >
                  <img
                    src={restaurant.ResturantImageURL}
                    alt={restaurant.restaurantName}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3 text-center">
                    <h3 className="text-lg font-semibold">{restaurant.restaurantName}</h3>
                    <p className="text-gray-600">{restaurant.address}</p>
                    <p className="text-gray-700 font-medium">Rs: {restaurant.avgCost}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    
        {/* Map Section (FULL SIZE like Home Page) */}
        <div className="hidden md:flex md:w-[37%] sticky top-5 self-start h-[80vh] max-h-[80vh] overflow-hidden mr-4 mt-5">
          {mapCenter && (
            <MapContainer
              center={mapCenter}
              zoom={11}
              className="h-full w-full rounded-lg shadow-lg"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {Hotels.hotels.map((hotel, index) => {
                const lat = hotel?.geoCoordinates?.latitude;
                const lng = hotel?.geoCoordinates?.longitude;
                if (!lat || !lng) return null;
                return (
                  <Marker key={`hotel-${index}`} position={[lat, lng]} icon={customIcon}>
                    <Popup>
                      <strong>{hotel.hotelName}</strong>
                      <p>{hotel.address}</p>
                      <p>Rs: {hotel.avgCost}</p>
                      <p>{hotel.starRating} ⭐</p>
                      <img src={hotel.hotelImageURL} alt={hotel.hotelName} className="w-24 rounded-md mt-2" />
                    </Popup>
                  </Marker>
                );
              })}
              {Hotels.restaurants.map((restaurant, index) => {
                const lat = restaurant?.geoCoordinates?.latitude;
                const lng = restaurant?.geoCoordinates?.longitude;
                if (!lat || !lng) return null;
                return (
                  <Marker key={`restaurant-${index}`} position={[lat, lng]} icon={customIcon}>
                    <Popup>
                      <strong>{restaurant.restaurantName}</strong>
                      <p>{restaurant.address}</p>
                      <p>Rs: {restaurant.avgCost}</p>
                      <img src={restaurant.resturantImageURL} alt={restaurant.restaurantName} className="w-24 rounded-md mt-2" />
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    );
      
    
}


export default Weather;
