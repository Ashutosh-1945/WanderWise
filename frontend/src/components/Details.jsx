import React, { useContext,useState, } from "react";
import DateRangePicker from "./Calender";
import Member from "./Member";
import InterestSelector from "./Interests";
import LoginModal from './Login';
import { UserContext } from "../UserConext";
import { useNavigate } from "react-router";
import Loading from "./Loading";

import {jwtDecode} from "jwt-decode";
import axios from "axios";

function Details() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { place, startDate, endDate, selectedTrip, withPets, selectedInterests, isAuthenticated } = useContext(UserContext);

  const handleSubmit = async () => {
    if(isAuthenticated){
      setLoading(true);
      const token = localStorage.getItem("accessToken"); 
      var email = 0;
      if (token) {
        const decoded = jwtDecode(token);
        email = decoded.email;
      }      
      const data = { email: email,
        destination: place,
        startDate: startDate,
        endDate: endDate,
        withWhom: selectedTrip,
        pets: withPets,
        goals: selectedInterests,
        plan: {},
        hotels: {}
      }
      try {
        const response = await axios.post("https://wanderwise-4.onrender.com/details", {
          data
        });  
        setLoading(false);
        navigate('/home');
      } catch (error) {
        console.log(error);
      } 
    }
    else{
      setIsModalOpen(true);
    }
  };
  if (loading) return <Loading />;
  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="text-2xl font-semibold text-black flex items-center gap-2 mb-8">
        <span>📍</span>
        <span>{place || "Your Destination"}</span>
      </div>
      <div className="flex flex-col w-full max-w-lg gap-6">
        <DateRangePicker />
        <Member />
        <InterestSelector />
      </div>
      <button onClick={handleSubmit} className="mt-6 w-full max-w-lg bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition">
        Submit Details
      </button>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default Details;