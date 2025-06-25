import React, { useEffect,createContext, useState,  } from "react";

import axios from "axios";
import { useNavigate } from "react-router";
// Create a context
const UserContext = createContext();


const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [place, setPlace] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState("SOLO");
  const [withPets, setWithPets] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const refreshAccessToken = async () => {
    try {
      const response = await axios.post("http://localhost:3000/refresh-token", {}, { withCredentials: true });
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        setIsAuthenticated(true);
        return response.data.accessToken;
      }
    } catch (error) {
      console.error("Token refresh failed", error);
      logout();
    }
  };

  // Check authentication on mount and refresh token if necessary
  useEffect(() => {
    const checkAuth = async () => {
      let token = localStorage.getItem("accessToken");

      if (!token) {
        token = await refreshAccessToken(); // Try getting a new access token
      }
      setIsAuthenticated(!!token);
    };

    checkAuth();
  }, []);

  const login = (token) => {
    setIsAuthenticated(true);
    localStorage.setItem("accessToken", token);
  };

  const logout = async () => {
    try {
      await axios.post("http://localhost:3000/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout failed", error);
    }
    setIsAuthenticated(false);
    localStorage.removeItem("accessToken");
    navigate('/')

  };


  return (
    <UserContext.Provider value={{ place, setPlace, startDate, setStartDate,endDate, setEndDate, selectedTrip, setSelectedTrip, withPets, setWithPets, selectedInterests, setSelectedInterests, isAuthenticated,setIsAuthenticated, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };