import { jwtDecode } from 'jwt-decode';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Weather() {
    const [user, setUser] = useState('');
    const [Data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                let email = "";

                if (token) {
                    const decoded = jwtDecode(token);
                    email = decoded.email; 
                } else {
                    throw new Error("No token found");
                }

                console.log("Fetching weather for:", email); // Debugging log

                const response = await axios.get("http://localhost:3000/getHotels", {
                    params: { email },
                });

                if (!response.data || !response.data.data) {
                    throw new Error("Invalid API response");
                }

                setUser(email);
                setData(response.data.data.current);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData(); 
    }, []); 

    return (
        <div></div>
    );
}


export default Weather;
