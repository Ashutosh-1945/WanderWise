import React, { useState,useContext } from "react";
import { UserContext } from "../UserConext";

const InterestSelector = () => {
  const [interests, setInterests] = useState([
    "Must-see Attractions",
    "Great Food",
    "Hidden Gems",
    "Historic Landmarks",
    "Bazaars and Shopping",
    "Places of Worship",
    "Nightlife and Entertainment",
    "Adventure and Sports",
    "Arts & Theatre",
    "+ Add interest",
  ]);
  const {selectedInterests, setSelectedInterests} = useContext(UserContext)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInterest, setNewInterest] = useState("");

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(
        selectedInterests.filter((item) => item !== interest)
      );
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest)) {
      setInterests([...interests.slice(0, -1), newInterest, "+ Add interest"]); 
      setNewInterest("");
      setIsModalOpen(false); // Close modal
    }
  };

  return (
    <div className="flex flex-col items-center py-10 px-4">
      <h2 className="text-2xl font-bold mb-2">Tell us what you’re interested in</h2>
      <p className="text-gray-500 mb-6">Select all that apply.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
        {interests.map((interest, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-full border text-sm font-medium ${
              selectedInterests.includes(interest)
                ? "bg-blue-600 text-white"
                : "bg-white text-black border-gray-300"
            } hover:border-black`}
            onClick={
              interest === "+ Add interest"
                ? () => setIsModalOpen(true) // Open modal
                : () => toggleInterest(interest)
            }
          >
            {interest}
          </button>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4 text-center">Add a New Interest</h2>
            <input
              type="text"
              placeholder="Enter a new interest"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="px-4 py-2 border w-full rounded-md mb-4 text-sm"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={addInterest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestSelector;
