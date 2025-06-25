import React from "react";
import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { UserContext } from "../UserConext";

const HeroSection = () => {
  const navigate = useNavigate();
  const { place, setPlace } = useContext(UserContext);

  function send() {
    navigate('/details')
  }

  return (
    <div className="flex flex-col items-center   bg-white">
      {/* Heading Section */}
      <div className="text-center space-y-4 mt-44">
        <h1 className="text-4xl font-bold text-gray-900">
          Plan Your Perfect Trip with{" "}
          <span className="text-blue-600">WanderWise</span>
        </h1>
        <p className="text-gray-700">
          Effortlessly plan trips, discover top spots, and enjoy stress-free
          travel. <br />
          <span className="font-bold">
            Start your journey today and let AI handle the details!
          </span>
        </p>
      </div>

      {/* Search Bar Section */}
      <div className="flex items-center mt-8">
        <input
          value= {place}
          onChange={(e) => setPlace(e.target.value)}
          type="text"
          placeholder="Where do you want to go?"
          className="w-80 px-4 py-2 text-gray-700 border border-gray-300 rounded-l-md focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button onClick={send} className="px-6 py-2 text-white bg-blue-600 rounded-r-md hover:bg-blue-700">
          GO
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
