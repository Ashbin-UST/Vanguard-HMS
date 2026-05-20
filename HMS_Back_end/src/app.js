require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const registrationRoutes = require("./routes/registrationRoutes");

const app = express();

// Used for secure HTTP headers
app.use(helmet());

// Enable CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

// Middleware which logs requests
app.use(morgan("dev"));

// Read JSON data sent from frontend/Postman
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/register", registrationRoutes);

// Default route
app.get("/", (req, res) => res.json({
    message: "API running"
}));

// MongoDB connection
const connectDB = async () => {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log("MongoDB connected");

    } catch (err) {

        console.error(
            "MongoDB connection error:",
            err.message
        );

        process.exit(1);
    }
};

connectDB();

module.exports = app;