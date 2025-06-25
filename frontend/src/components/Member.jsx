import React, { useContext, useState } from "react";
import { UserContext } from "../UserConext";

const TripPlanner = () => {
  const {selectedTrip, setSelectedTrip, withPets, setWithPets} = useContext(UserContext)

  const tripOptions = [
    { value: "SOLO", label: "Solo Trip", icon: "👤" },
    { value: "PARTNER", label: "Partner trip", icon: "❤️" },
    { value: "FRIENDS", label: "Friends Trip", icon: "👥" },
    { value: "FAMILY", label: "Family trip", icon: "👪" },
  ];

  return (
    <div className="flex-row p-8 max-w-md mx-auto">
      {/* Title */}
      <div className="text-2xl font-bold mb-4 text-center">
        What kind of trip are you planning?
      </div>
      <div className="text-sm text-gray-600 mb-6 text-center">Select one.</div>

      {/* Trip Options */}
      <div className=" justify-center flex gap-5">
        {tripOptions.map((option) => (
          <button
            key={option.value}
            className={`px-14 py-8 rounded-lg border-2 flex flex-col items-center justify-center space-y-2 ${
              selectedTrip === option.value
                ? "border-blue-500 blue-green-00"
                : "border-gray-200"
            }`}
            onClick={() => setSelectedTrip(option.value)}
          >
            <span className="text-2xl">{option.icon}</span>
            <span className="text-gray-800 font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Pets Question */}
      <div className="mt-8">
        <div className="text-sm text-gray-600 mb-2 text-center">
          Are you travelling with pets? <span className="text-gray-400">(i)</span>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            className={`px-6 py-2 rounded-full font-medium ${
              withPets
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 border border-gray-300"
            }`}
            onClick={() => setWithPets(true)}
          >
            Yes
          </button>
          <button
            className={`px-6 py-2 rounded-full font-medium ${
              !withPets
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 border border-gray-300"
            }`}
            onClick={() => setWithPets(false)}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
