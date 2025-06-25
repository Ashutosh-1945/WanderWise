const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true, 
  })
);


const OPENVERSE_API_URL = process.env.OPENVERSE_API_URL;
const apiKey = process.env.GOOGLE_API_KEY;
const uri = process.env.MONGO_URI;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const PORT = process.env.PORT;


const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function connectToDatabase() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); 
  }
}
connectToDatabase();

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true, 
        default: () => new mongoose.Types.ObjectId().toString(), // Generate a unique string-based ID
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
        type: String,
        required: true,
        minlength: 6, // Ensure passwords are at least 6 characters

      },
    trips: [
      {
        tripId: {
          type: mongoose.Schema.Types.ObjectId, // Unique ID for each trip
          default: () => new mongoose.Types.ObjectId(),
          required: true,
        },
        destination: {
          type: String,
          required: true,
          trim: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        withWhom: {
          type: String, 
          required: true,
          trim: true,
        },
        pets: {
          type: Boolean,
          required: true,
        },
        goals: 
        {
          type: [String]
        },
        plan:
        {
          type: Object,
        },
        hotels:
        {
          type: Object,
        },
        chatHistory: [
          {
            role: {
              type: String,
              enum: ['user', 'assistant'],
              required: true
            },
            message: {
              type: String,
              required: true,
              trim: true
            },
            timestamp: {
              type: Date,
              default: Date.now
            }
          }
        ]
      },
    ],
    refreshToken: { type: String },
  }, { collection: 'User', timestamps: true });
const User = mongoose.model('User', userSchema);

async function fetchImageURL(placeName) {
  try {
      const response = await axios.get(`${OPENVERSE_API_URL}?q=${encodeURIComponent(placeName)}&limit=1`);
      if (response.data.results.length > 0) {
          return response.data.results[0].url;
      }
      return null;
  } catch (error) {
      console.error("Error fetching image from Openverse:", error.message);
      return null;
  }
}

async function fetchImagesGroup(category) {
  try {
      const response = await axios.get(`${OPENVERSE_API_URL}?q=${category}&limit=10`);
      return response.data.results.map(item => item.url).filter(Boolean); 
  } catch (error) {
      console.error(`Error fetching ${category} images:`, error);
      return [];
  }
}

async function fetchAndMapImages(tripData) {
  try {
      const [hotelImages, restaurantImages] = await Promise.all([
          fetchImagesGroup("hotel exterior"),
          fetchImagesGroup("restaurant and cafes"),
      ]);
      tripData.hotels.hotels.forEach((hotel, index) => {
          hotel.hotelImageURL = hotelImages[index] || "fallback_hotel_image.jpg";
      });
      tripData.hotels.restaurants.forEach((restaurant, index) => {
          restaurant.ResturantImageURL= restaurantImages[index] || "fallback_restaurant_image.jpg";
      });

      console.log("Updated tripData with images:", tripData);
  } catch (error) {
      console.error("Error in fetchAndMapImages:", error);
  }
}

const generateAccessToken = (payload) => jwt.sign( payload , ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
const generateRefreshToken = (payload) => jwt.sign( payload , REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

app.post('/register', async (req, res) => {
  const {name, email, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
    });
  try {
    const savedUser = await newUser.save();
    console.log('User created successfully', savedUser);
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,   
    secure: true,  
    sameSite: "Strict", 
    path: "/refresh-token", 
  });

  res.json({ accessToken });
});


app.post("/details", async (req, res) => {
  const tripData = req.body.data;
  console.log(tripData);
  const email = tripData.email;

  try {
    const user = await User.findOne({ email: email });
    console.log(email)
    async function run() {
      const userPrompt = `
        Generate a Travel Plan for Location: ${tripData.destination}, from ${tripData.startDate} to ${tripData.endDate} for ${tripData.withWhom} with ${tripData.pets ? "Pets" : "No Pets"} focus on ${tripData.goals.join(', ')}
        Also, suggest an itinerary with:
          - Place Name
          - Place Details(bit elaborate)
          - Place Image URL
          - Geo Coordinates(just numbers no degree or any symbol)
          - Ticket Pricing
          - Travel Time between each location from start date to end date (with daily plans and best times to visit).
          Format the response in JSON format. Do NOT include any explanatory text or other content outside the JSON object itself.
          `;
      try {
        const chatSession = model.startChat({
          generationConfig,
          history: [
            {
              role: "user",
              parts: [
                {text: "\nGenerate a Travel Plan for Location: ${tripData.destination}, from ${tripData.startDate} to ${tripData.endDate} for ${tripData.withWhom} with ${tripData.pets ? \"Pets\" : \"No Pets\"} focus on ${tripData.goals.join(', ')}\n          Also, suggest an itinerary with:\n            - Place Name\n            - Place Details(bit elaborate)\n            - Place Image URL\n            - Geo Coordinates\n            - Ticket Pricing\n            - Travel Time between each location from start date to end date (with daily plans and best times to visit).\n            Format the response in JSON format. Do NOT include any explanatory text or other content outside the JSON object itself.\n\n        `;"},
              ],
            },
            {
              role: "model",
              parts: [
                {text: "```json\n{\n  \"tripDetails\": {\n    \"destination\": \"PLACEHOLDER_DESTINATION\",\n    \"startDate\": \"PLACEHOLDER_START_DATE\",\n    \"endDate\": \"PLACEHOLDER_END_DATE\",\n    \"withWhom\": \"PLACEHOLDER_WITH_WHOM\",\n    \"pets\": \"PLACEHOLDER_PETS_OR_NO_PETS\",\n    \"goals\": [\"PLACEHOLDER_GOAL_1\", \"PLACEHOLDER_GOAL_2\", \"PLACEHOLDER_GOAL_3\"] \n  },\n  \"itinerary\": {\n    \"day1\": [\n      {\n        \"placeName\": \"PLACEHOLDER_PLACE_NAME_1\",\n        \"placeDetails\": \"PLACEHOLDER_PLACE_DETAILS_1\",\n        \"placeImageUrl\": \"PLACEHOLDER_IMAGE_URL_1\",\n        \"geoCoordinates\": {\n          \"latitude\": \"PLACEHOLDER_LATITUDE_1\",\n          \"longitude\": \"PLACEHOLDER_LONGITUDE_1\"\n        },\n        \"ticketPricing\": \"PLACEHOLDER_PRICE_1\",\n        \"travelTime\": \"PLACEHOLDER_TRAVEL_TIME_1\"\n      },\n      {\n        \"placeName\": \"PLACEHOLDER_PLACE_NAME_2\",\n        \"placeDetails\": \"PLACEHOLDER_PLACE_DETAILS_2\",\n        \"placeImageUrl\": \"PLACEHOLDER_IMAGE_URL_2\",\n        \"geoCoordinates\": {\n          \"latitude\": \"PLACEHOLDER_LATITUDE_2\",\n          \"longitude\": \"PLACEHOLDER_LONGITUDE_2\"\n        },\n        \"ticketPricing\": \"PLACEHOLDER_PRICE_2\",\n        \"travelTime\": \"PLACEHOLDER_TRAVEL_TIME_2\"\n      }\n\n    ],\n    \"day2\": [\n      {\n        \"placeName\": \"PLACEHOLDER_PLACE_NAME_3\",\n        \"placeDetails\": \"PLACEHOLDER_PLACE_DETAILS_3\",\n        \"placeImageUrl\": \"PLACEHOLDER_IMAGE_URL_3\",\n        \"geoCoordinates\": {\n          \"latitude\": \"PLACEHOLDER_LATITUDE_3\",\n          \"longitude\": \"PLACEHOLDER_LONGITUDE_3\"\n        },\n        \"ticketPricing\": \"PLACEHOLDER_PRICE_3\",\n        \"travelTime\": \"PLACEHOLDER_TRAVEL_TIME_3\"\n      }\n    ],\n    \"day3\": [\n      {\n        \"placeName\": \"PLACEHOLDER_PLACE_NAME_4\",\n        \"placeDetails\": \"PLACEHOLDER_PLACE_DETAILS_4\",\n        \"placeImageUrl\": \"PLACEHOLDER_IMAGE_URL_4\",\n        \"geoCoordinates\": {\n          \"latitude\": \"PLACEHOLDER_LATITUDE_4\",\n          \"longitude\": \"PLACEHOLDER_LONGITUDE_4\"\n        },\n        \"ticketPricing\": \"PLACEHOLDER_PRICE_4\",\n        \"travelTime\": \"PLACEHOLDER_TRAVEL_TIME_4\"\n      }\n    ]\n  },\n  \"bestTimesToVisit\": \"PLACEHOLDER_BEST_TIMES_TO_VISIT\"\n}\n```\n\nRemember to replace all `PLACEHOLDER` values with the appropriate data.  You will need to perform external research to obtain this information.  This JSON structure provides the framework; you must populate it.\n"},
              ],
            },
          ],
        });
        const result = await chatSession.sendMessage(userPrompt);
        return result.response.text(); 
      } catch (error) {
        console.error("Error occurredyyy:", error);
      }
    }
    async function fetchHotels() {
      const hotelPrompt = `
        Generate a list of 10 hotels and 10 resturants separately in 2 objects for ${tripData.destination} from ${tripData.startDate} to ${tripData.endDate}. 
        Provide:
        - hotelName
        - address
        - geoCoordinates
        - StarRating
        - avgCost
        - Distance from City Center
        - HotelImageURL
        - ResturantImageURL
        Format the response in JSON format. Do NOT include any explanatory text outside the JSON object. Do not change the structure of object as in history
      `;
      try {
        const chatSession = model.startChat({
          generationConfig,
          history: [
            {
              role: "user",
              parts: [
                {text: "Generate a list of 10 hotels and 10 resturants separately in 2 objects for ${tripData.destination} from ${tripData.startDate} to ${tripData.endDate}. \n          Provide:\n          - Hotel Name\n          - Address\n          - Geo coordinates\n          - Star Rating\n          - Avg cost\n          - Distance from City Center\n          - Hotel Image URL\n          - Resturant Image URL\n          Format the response in JSON format. Do NOT include any explanatory text outside the JSON object.\n\n"},
              ],
            },
            {
              role: "model",
              parts: [
                {text: "```json\n{\n  \"hotels\": [\n    {\n      \"hotelName\": \"Hotel Majestic Barcelona\",\n      \"address\": \"Passeig de Gràcia, 68, 08007 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3906,\n        \"longitude\": 2.1689\n      },\n      \"starRating\": 5,\n      \"avgCost\": 350,\n      \"distanceFromCityCenter\": 0.5,\n      \"hotelImageURL\": \"https://example.com/hotel_majestic_barcelona.jpg\"\n    },\n    {\n      \"hotelName\": \"W Barcelona\",\n      \"address\": \"Plaça de la Rosa dels Vents, 1, Final, Passeig Joan de Borbó, 08039 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3655,\n        \"longitude\": 2.1926\n      },\n      \"starRating\": 5,\n      \"avgCost\": 400,\n      \"distanceFromCityCenter\": 3.0,\n      \"hotelImageURL\": \"https://example.com/w_barcelona.jpg\"\n    },\n    {\n      \"hotelName\": \"Hotel Arts Barcelona\",\n      \"address\": \"Carrer de la Marina, 19-21, 08005 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3846,\n        \"longitude\": 2.1924\n      },\n      \"starRating\": 5,\n      \"avgCost\": 380,\n      \"distanceFromCityCenter\": 2.5,\n      \"hotelImageURL\": \"https://example.com/hotel_arts_barcelona.jpg\"\n    },\n    {\n      \"hotelName\": \"H10 Metropolitan\",\n      \"address\": \"Rambla de Catalunya, 7-9, 08007 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3858,\n        \"longitude\": 2.1702\n      },\n      \"starRating\": 4,\n      \"avgCost\": 250,\n      \"distanceFromCityCenter\": 0.7,\n      \"hotelImageURL\": \"https://example.com/h10_metropolitan.jpg\"\n    },\n    {\n      \"hotelName\": \"Ohla Barcelona\",\n      \"address\": \"Via Laietana, 28, 08003 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3854,\n        \"longitude\": 2.1768\n      },\n      \"starRating\": 5,\n      \"avgCost\": 320,\n      \"distanceFromCityCenter\": 1.0,\n      \"hotelImageURL\": \"https://example.com/ohla_barcelona.jpg\"\n    },\n    {\n      \"hotelName\": \"Hotel El Palace Barcelona\",\n      \"address\": \"Gran Via de les Corts Catalanes, 668, 08010 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3926,\n        \"longitude\": 2.1708\n      },\n      \"starRating\": 5,\n      \"avgCost\": 450,\n      \"distanceFromCityCenter\": 0.3,\n      \"hotelImageURL\": \"https://example.com/el_palace_barcelona.jpg\"\n    },\n    {\n      \"hotelName\": \"Yurbban Passage Hotel & Spa\",\n      \"address\": \"Passatge del Permanyer, 13, 08009 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3943,\n        \"longitude\": 2.1639\n      },\n      \"starRating\": 4,\n      \"avgCost\": 280,\n      \"distanceFromCityCenter\": 0.8,\n      \"hotelImageURL\": \"https://example.com/yurbban_passage.jpg\"\n    },\n    {\n      \"hotelName\": \"Catalonia Barcelona Plaza\",\n      \"address\": \"Plaça d'Espanya, 6-8, 08014 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3682,\n        \"longitude\": 2.1504\n      },\n      \"starRating\": 4,\n      \"avgCost\": 220,\n      \"distanceFromCityCenter\": 3.5,\n      \"hotelImageURL\": \"https://example.com/catalonia_barcelona_plaza.jpg\"\n    },\n    {\n      \"hotelName\": \"Sir Victor Hotel\",\n      \"address\": \"Carrer del Rosselló, 265, 08008 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3954,\n        \"longitude\": 2.1612\n      },\n      \"starRating\": 5,\n      \"avgCost\": 370,\n      \"distanceFromCityCenter\": 1.0,\n      \"hotelImageURL\": \"https://example.com/sir_victor_hotel.jpg\"\n    },\n    {\n      \"hotelName\": \"Hotel Soho Barcelona\",\n      \"address\": \"Gran Via de les Corts Catalanes, 543-545, 08011 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3822,\n        \"longitude\": 2.1566\n      },\n      \"starRating\": 4,\n      \"avgCost\": 230,\n      \"distanceFromCityCenter\": 1.5,\n      \"hotelImageURL\": \"https://example.com/hotel_soho_barcelona.jpg\"\n    }\n  ],\n  \"restaurants\": [\n    {\n      \"restaurantName\": \"Tickets Bar\",\n      \"address\": \"Avinguda del Paraŀlel, 164, 08015 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3734,\n        \"longitude\": 2.1699\n      },\n      \"avgCost\": 60,\n      \"distanceFromCityCenter\": 2.0,\n      \"resturantImageURL\": \"https://example.com/tickets_bar.jpg\"\n    },\n    {\n      \"restaurantName\": \"Disfrutar\",\n      \"address\": \"Carrer de Villarroel, 163, 08036 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3878,\n        \"longitude\": 2.1557\n      },\n      \"avgCost\": 150,\n      \"distanceFromCityCenter\": 1.8,\n      \"resturantImageURL\": \"https://example.com/disfrutar.jpg\"\n    },\n    {\n      \"restaurantName\": \"ABaC Restaurant\",\n      \"address\": \"Avinguda del Tibidabo, 1, 08022 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.4107,\n        \"longitude\": 2.1317\n      },\n      \"avgCost\": 180,\n      \"distanceFromCityCenter\": 5.0,\n      \"resturantImageURL\": \"https://example.com/abac_restaurant.jpg\"\n    },\n    {\n      \"restaurantName\": \"Ciudad Condal\",\n      \"address\": \"Rambla de Catalunya, 18, 08007 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3852,\n        \"longitude\": 2.1703\n      },\n      \"avgCost\": 35,\n      \"distanceFromCityCenter\": 0.8,\n      \"resturantImageURL\": \"https://example.com/ciudad_condal.jpg\"\n    },\n    {\n      \"restaurantName\": \"Can Culleretes\",\n      \"address\": \"Carrer d'en Quintana, 5, 08002 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3842,\n        \"longitude\": 2.1748\n      },\n      \"avgCost\": 40,\n      \"distanceFromCityCenter\": 1.2,\n      \"resturantImageURL\": \"https://example.com/can_culleretes.jpg\"\n    },\n    {\n      \"restaurantName\": \"7 Portes\",\n      \"address\": \"Passeig d'Isabel II, 14, 08003 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3825,\n        \"longitude\": 2.1835\n      },\n      \"avgCost\": 50,\n      \"distanceFromCityCenter\": 1.5,\n      \"resturantImageURL\": \"https://example.com/7_portes.jpg\"\n    },\n    {\n      \"restaurantName\": \"Bar del Pla\",\n      \"address\": \"Carrer dels Carders, 19, 08003 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3867,\n        \"longitude\": 2.1814\n      },\n      \"avgCost\": 30,\n      \"distanceFromCityCenter\": 1.3,\n      \"resturantImageURL\": \"https://example.com/bar_del_pla.jpg\"\n    },\n    {\n      \"restaurantName\": \"Tapeo\",\n      \"address\": \"Carrer de Montcada, 29, 08003 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3849,\n        \"longitude\": 2.1801\n      },\n      \"avgCost\": 45,\n      \"distanceFromCityCenter\": 1.4,\n      \"resturantImageURL\": \"https://example.com/tapeo.jpg\"\n    },\n    {\n      \"restaurantName\": \"Brunch & Cake\",\n      \"address\": \"Rosselló, 189, 08036 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3939,\n        \"longitude\": 2.1574\n      },\n      \"avgCost\": 25,\n      \"distanceFromCityCenter\": 1.0,\n      \"resturantImageURL\": \"https://example.com/brunch_and_cake.jpg\"\n    },\n    {\n      \"restaurantName\": \"El Xampanyet\",\n      \"address\": \"Carrer de Montcada, 22, 08003 Barcelona, Spain\",\n      \"geoCoordinates\": {\n        \"latitude\": 41.3845,\n        \"longitude\": 2.1795\n      },\n      \"avgCost\": 20,\n      \"distanceFromCityCenter\": 1.4,\n      \"resturantImageURL\": \"https://example.com/el_xampanyet.jpg\"\n    }\n  ]\n}\n```"},
              ],
            },
          ],
        });
        const result = await chatSession.sendMessage(hotelPrompt);
        return result.response.text();
      } catch (error) {
        console.error("Error fetching hotels:", error);
        return null;
      }
    }

    tripData.plan = JSON.parse(await run());
    tripData.hotels = JSON.parse(await fetchHotels());



    for (const [day, places] of Object.entries(tripData.plan.itinerary)) {
      for (const place of places) {
        const imageURL = await fetchImageURL(place.placeName);
        if (imageURL) {
          place.placeImageUrl = imageURL;
        }
      }
    }
    console.log(tripData);
    await fetchAndMapImages(tripData);

    user.trips.push(tripData); 
    await user.save(); 
    res.status(201).json({ message: "Data entered", tripData });
  } catch (error) {
    console.error("Error occurredxxx:", error.message);
    res.status(500).json({ error: "Failed to retrieve or save data" });
  }
});

  
app.get("/getplan", async (req,res) => {
  const { email } = req.query;
  console.log(req.body);
  try{
    const user = await User.findOne({email: email});

    const data = user.trips.at(-1).plan;
    
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve data"});
  }


})

app.get("/getWeather", async (req,res) => {
  const { email } = req.query;
  console.log(req.body);
  try{
    const user = await User.findOne({email: email});

    const place = user.trips.at(-1).destination;
    const data = await fetchWeather(place);
    console.log(data);
    
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve data"});
  }
})

app.get("/getHotels", async (req,res) => {
  const { email } = req.query;
  console.log(req.body);
  try{
    const user = await User.findOne({email: email});
    const data = user.trips.at(-1).hotels;
    console.log(data)
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve data"});
  }
})

app.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken; 

  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await User.findOne({ refreshToken });
  if (!user) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); 
    const newAccessToken = generateAccessToken({
        id: user.id, 
        email: user.email, 
        name: user.name
    });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "strict" });
  res.json({ message: "Logged out successfully" });
});

app.get('/chathistory/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({email: email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log(user)

    const data = user.trips.at(-1);
    if (!data.chatHistory) data.chatHistory = [];

    if (data.chatHistory.length === 0) {
      const greeting = {
        role: 'assistant',
        message: 'Hi! How can I help you today?',
        timestamp: new Date(),
      };
      data.chatHistory.push(greeting);
      await user.save();
      return res.json({ chatHistory: [greeting] });
    }
    res.json({ chatHistory: data.chatHistory });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/sendMessage', async (req, res) => {
  const { email, message } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data = user.trips.at(-1);
    if (!data.chatHistory) data.chatHistory = [];
    data.chatHistory.push({ role: 'user', message });

    const chatHistoryToSend = data.chatHistory[0].role === 'assistant'
    ? data.chatHistory.slice(1)
    : data.chatHistory;
    
    const history = chatHistoryToSend.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    }));

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(message);
    const aiMessage = result.response.text();

    data.chatHistory.push({ role: 'assistant', message: aiMessage });
    await user.save();

    res.json({ message: aiMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
