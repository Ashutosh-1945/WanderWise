import React, { useState } from 'react';
import { useContext } from 'react';
import logo from '../assets/logo.png';
import { Link, NavLink, useLocation } from 'react-router-dom';
import LoginModal from './Login';
import SignUpModal from './Signup';
import {UserContext} from '../UserConext';  

function Header() {
  const { isAuthenticated, login, logout } = useContext(UserContext);  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUpOpen, setSignUpOpen] = useState(false);

  const location = useLocation();
  const isHomePage = location.pathname === '/home'
  const isAbout = location.pathname === '/reach'
  const isContact = location.pathname === '/weather'
  const isHotels = location.pathname === '/hotels'
  const isChat = location.pathname === '/chat'


  const openModal = () => setIsModalOpen(true); // login modal 
  const closeModal = () => setIsModalOpen(false); // login modal

  const openSignModal = () => setSignUpOpen(true);

  const handleSignUpSuccess = () => {
    setSignUpOpen(false);
    setIsModalOpen(true);
  };

  return (
    <>
      <header className="flex justify-between items-center px-4 py-2 shadow-md bg-white">
        {/* Left Section: Logo */}
        <div className="flex items-center space-x-2">
          <img 
            src={logo}
            alt="Logo" 
            className="h-10 w-10 object-contain" 
          />
          <span className="text-xl font-bold text-gray-800">WanderWise</span>
        </div>

        {/*Mid Section: Navigation*/}      
        {(isHomePage||isAbout||isContact||isHotels||isChat)  && (
          <div className='flex items-centre space-x-2'>
            <NavLink
            to="/home"
            className={({ isActive }) =>
              `px-4 py-2 rounded ${isActive ? "bg-blue-500 text-white" : "text-gray-300"}`
            }
            >
            Home
            </NavLink>

            <NavLink
              to="/reach"
              className={({ isActive }) =>
                `px-4 py-2 rounded ${isActive ? "bg-blue-500 text-white" : "text-gray-300"}`
              }
            >
              Reach
            </NavLink>

            <NavLink
              to="/hotels"
              className={({ isActive }) =>
                `px-4 py-2 rounded ${isActive ? "bg-blue-500 text-white" : "text-gray-300"}`
              }
            >
              Hotels 
            </NavLink>
            
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `px-4 py-2 rounded ${isActive ? "bg-blue-500 text-white" : "text-gray-300"}`
              }
            >
              Chat
            </NavLink>
          </div>
        )}
        

        {/* Right Section: Buttons */}
        <div className="flex space-x-4">
          {isAuthenticated ? (
            <>
              <button
                onClick={logout}
                className="px-8 py-2 text-sm font-medium text-gray-800 border border-blue-700 rounded hover:bg-gray-100"
              >
                Log Off
              </button>
              <button 
                className="px-8 py-2 text-sm font-medium text-white bg-blue-700 rounded hover:bg-blue-800"
              >
                Profile
              </button>
            </>
          ) : (
            <>
              <button onClick={openModal} className="px-8 py-2 text-sm font-medium text-gray-800 border border-blue-700 rounded hover:bg-gray-100">
                Log In
              </button>
              <button onClick={openSignModal} className="px-8 py-2 text-sm font-medium text-white bg-blue-700 rounded hover:bg-blue-800">
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      <LoginModal isOpen={isModalOpen} onClose={closeModal} />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setSignUpOpen(false)} onSuccess={handleSignUpSuccess} />
    </>
  );
}

export default Header;