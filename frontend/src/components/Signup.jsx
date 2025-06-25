import React from "react";
import { useState } from "react";
import axios from "axios";
import LoginModal from "./Login";

const SignUpModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;
  
  const [name, setname] = useState('');
  const [email, setemail] = useState('');
  const [password,setpassword] = useState('');
  const [cnfpassword, setcnfpassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async () => {
    if (password !== cnfpassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/register', {
        name,
        email,
        password,
      });
      
      if (response.status === 201) {
        alert('Successful Registration');
        onSuccess();
        setMessage(response.data.message);
      }

      setname('');
      setemail('');
      setpassword('');
      setcnfpassword('');
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.error || 'Registration failed');

    }
    console.log(name)
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-0 shadow-lg overflow-hidden flex flex-col lg:flex-row max-w-4xl w-full">
        {/* Image Section */}
        <div
          className="hidden lg:block lg:w-1/2 bg-cover"
          style={{
            backgroundImage: `url(https://www.tailwindtap.com//assets/components/form/userlogin/login_tailwindtap.jpg)`,
            backgroundSize: "cover", // Ensures the image fully covers the area
            backgroundPosition: "center", // Centers the image
            backgroundRepeat: "no-repeat", // Prevents tiling
          }}
        ></div>

        {/* Form Section */}
        <div className="w-full lg:w-1/2 p-16 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>

          <p className="text-xl text-gray-600 text-center">Create Your Account</p>

          {/* Name Input */}
          <div className="mt-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Full Name
            </label>
            <input
              value = {name}
              onChange = {(e) => setname(e.target.value)}        
              className="text-gray-700 border border-gray-300 rounded py-2 px-4 block w-full focus:outline-2 focus:outline-blue-700"
              type="text"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Email Input */}
          <div className="mt-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              value = {email}
              onChange = {(e) => setemail(e.target.value)}
              className="text-gray-700 border border-gray-300 rounded py-2 px-4 block w-full focus:outline-2 focus:outline-blue-700"
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="mt-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setpassword(e.target.value)}
              className="text-gray-700 border border-gray-300 rounded py-2 px-4 block w-full focus:outline-2 focus:outline-blue-700"
              type="password"
              placeholder="Create a password"
              required
            />
          </div>

          {/* Confirm Password Input */}
          <div className="mt-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Confirm Password
            </label>
            <input
              value= {cnfpassword}
              onChange={(e) => setcnfpassword(e.target.value)}
              className="text-gray-700 border border-gray-300 rounded py-2 px-4 block w-full focus:outline-2 focus:outline-blue-700"
              type="password"
              placeholder="Re-enter your password"
              required
            />
          </div>

          {/* Sign Up Button */}
          <div className="mt-8">
            <button onClick={handleSignUp} className="bg-blue-700 text-white font-bold py-2 px-4 w-full rounded hover:bg-blue-600">
              Sign Up
            </button>
          </div>

          <div className="mt-4 flex items-center w-full text-center">
            <a
              href="#"
              className="text-xs text-gray-500 capitalize text-center w-full"
            >
              Already have an account?{" "}
              <span className="text-blue-700">Login</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;
