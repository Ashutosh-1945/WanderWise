import Header from "./components/Header"
import HeroSection from "./components/Hero" 
import LoginWithGoogleButton from "./components/Login";
import Signup from "./components/Signup";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Details from "./components/Details";
import Home from "./components/Home";
import Weather from "./components/Weather";
import Reach from "./components/Reach";
import Hotels from "./components/Hotels"
import ChatBot from "./components/Chatbot";
import { UserProvider } from "./UserConext";

function App() {
  return (
    <UserProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HeroSection />}/>
          <Route path='/login' element={<LoginWithGoogleButton/>} />
          <Route path='/signup' element={<Signup/>} />
          <Route path='/details' element={<Details/>} />
          <Route path='/home' element={<Home />} />
          <Route path='/weather' element={<Weather/>}/>
          <Route path='/reach' element={<Reach />}/>
          <Route path='/hotels' element={<Hotels />}/>
          <Route path='/chat' element={<ChatBot />} />
        </Routes>    
    </UserProvider>
  )
}

export default App
