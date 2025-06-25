import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';


const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatRef = useRef(null);

  const token = localStorage.getItem("accessToken");
  let email = null;
  if (token) {
    const decoded = jwtDecode(token);
    email = decoded.email;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/chathistory/${email}`);
        
        const normalized = res.data.chatHistory.map(msg => ({
          role: msg.role,
          content: msg.message 
        }));

        setMessages(normalized);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [email]);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userMessage = { role: 'user', content: userInput }; // ✅ using `content`
    setUserInput('');
    setIsBotTyping(true);

    try {
      const res = await axios.post('http://localhost:3000/sendMessage', {
        email,
        message: userInput,
      });

      const botReply = { role: 'assistant', content: res.data.message }; // ✅ consistent structure
      setMessages(prev => [...prev, userMessage, botReply]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [
        ...prev,
        userMessage,
        { role: 'assistant', content: 'Something went wrong. Please try again.' }
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-blue-50">
      <div className="text-center text-white bg-blue-600 py-4 text-xl font-semibold shadow-md">
        ✈️ Travel AI Chatbot
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`px-4 py-2 rounded-2xl max-w-xs whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800 border border-blue-200'
            }`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>
      ))}


        {isBotTyping && (
          <div className="text-gray-500 italic text-sm">Mia is typing...</div>
        )}

        <div ref={chatRef}></div>
      </div>

      <div className="flex px-4 py-3 border-t bg-white">
        <input
          type="text"
          placeholder="Ask Mia anything..."
          className="flex-1 px-4 py-2 rounded-full border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="ml-2 px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
