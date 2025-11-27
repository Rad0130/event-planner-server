const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

// More flexible CORS configuration for deployment
const allowedOrigins = [
  'http://localhost:3000',
  // We'll add the production domains dynamically
];

// Check if in production and allow common Vercel patterns
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all subdomains of vercel.app in production
    if (isProduction && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow localhost in development
    if (!isProduction && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Check against our allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow specific production domains (you can add these later)
    const productionDomains = [
      'https://your-app-name.vercel.app', // You'll replace this after deployment
    ];
    
    if (productionDomains.some(domain => origin === domain)) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dm5zycv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db("SRevent");
    const events = db.collection("events");
    const bookings = db.collection("bookings");
    const messages = db.collection("messages");
    const users = db.collection("users");

    // Root route
    app.get("/", (req, res) => {
      res.send("Event Planner API is Running...");
    });

    // ========== EVENTS CRUD ==========
    // GET all events
    app.get("/events", async (req, res) => {
      const result = await events.find().toArray();
      res.send(result);
    });

    // GET single event
    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const result = await events.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // POST add event
    app.post("/events", async (req, res) => {
      const newEvent = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await events.insertOne(newEvent);
      res.send(result);
    });

    // PATCH update event
    app.patch("/events/:id", async (req, res) => {
      const id = req.params.id;
      const updatedEvent = req.body;

      const updateDoc = {
        $set: {
          ...updatedEvent,
          updatedAt: new Date()
        }
      };

      const result = await events.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);
    });

    // DELETE event
    app.delete("/events/:id", async (req, res) => {
      const id = req.params.id;
      const result = await events.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ========== BOOKINGS CRUD ==========
    // GET all bookings (for admin)
    app.get("/bookings", async (req, res) => {
      const result = await bookings.find().toArray();
      res.send(result);
    });

    // GET bookings by user email
    app.get("/bookings/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await bookings.find({ userEmail: email }).toArray();
      res.send(result);
    });

    // POST create booking
    app.post("/bookings", async (req, res) => {
      const booking = {
        ...req.body,
        status: "pending", // pending, confirmed, cancelled, completed
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await bookings.insertOne(booking);
      res.send(result);
    });

    // PATCH update booking status
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const { status, adminNotes } = req.body;

      const updateDoc = {
        $set: {
          status,
          adminNotes: adminNotes || "",
          updatedAt: new Date()
        }
      };

      const result = await bookings.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);
    });

    // DELETE booking
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bookings.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ========== MESSAGES CRUD ==========
    // GET all messages (for admin)
    app.get("/messages", async (req, res) => {
      const result = await messages.find().toArray();
      res.send(result);
    });

    // POST create message
    app.post("/messages", async (req, res) => {
      const message = {
        ...req.body,
        status: "unread", // unread, read, replied
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await messages.insertOne(message);
      res.send(result);
    });

    // PATCH update message status
    app.patch("/messages/:id", async (req, res) => {
      const id = req.params.id;
      const { status, adminReply } = req.body;

      const updateDoc = {
        $set: {
          status,
          adminReply: adminReply || "",
          updatedAt: new Date()
        }
      };

      const result = await messages.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);
    });

    // DELETE message
    app.delete("/messages/:id", async (req, res) => {
      const id = req.params.id;
      const result = await messages.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ========== USERS MANAGEMENT ==========
    // GET all users (for admin)
    app.get("/users", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });

    // POST create user
    app.post("/users", async (req, res) => {
      const user = {
        ...req.body,
        role: "user", // user, admin
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await users.insertOne(user);
      res.send(result);
    });

    // GET user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await users.findOne({ email });
      res.send(result);
    });

    console.log("MongoDB Connected Successfully!");

  } catch (error) {
    console.error("Database connection error:", error);
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Event Planner server running on port ${PORT}`);
});