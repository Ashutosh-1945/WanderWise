import React, { useState,useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UserContext } from "../UserConext";

const TripDateSelector = () => {
  const {startDate, setStartDate,endDate, setEndDate} = useContext(UserContext)

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      setEndDate(null); // Clear end date if invalid
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  return (
    <div className="  mb-2 flex justify-center p-6">
      <div className="  flex-row justify-center p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-black text-center mb-6">
          When are you going?
        </h2>
        <div className="flex">
          {/* Start Date Picker */}
          <div className="bg-white flex flex-col justify-center items-center w-full lg:w-1/2">

            <label className="text-blue-700 font-medium mb-2 text-sm">
              From
            </label>
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              minDate={new Date()}
              placeholderText="Select start date"
              className="bg-blue-50 border border-blue-300 text-blue-700 text-sm rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Date Picker */}
          <div className="bg-white flex flex-col justify-center items-center w-full lg:w-1/2">

            <label className="text-blue-700 font-medium mb-2 text-sm">
              To
            </label>
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || new Date()}
              placeholderText="Select end date"
              className="bg-blue-50 border border-blue-300 text-blue-700 text-sm rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-6 text-center">
          {startDate && endDate ? (
            <p className="text-blue-700 font-medium">
              <span className="font-bold">Trip Dates:</span> From{" "}
              {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
            </p>
          ) : (
            <p className="text-gray-600">
              Please select both start and end dates to plan your trip.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default TripDateSelector;
