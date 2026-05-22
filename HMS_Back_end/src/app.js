require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const app = express();

// Used for secure HTTP headers
app.use(helmet());

// Enable CORS
app.use(
    cors({
        origin: 'http://localhost:4200'
        
    })
);

// Middleware which logs requests
app.use(morgan("dev"));

// Read JSON data sent from frontend/Postman
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const htmlRoutes = require("./routes/htmlRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const employeeRoutes=require("./routes/employeeRoutes");
const auditLogRoutes=require("./routes/auditLogRoutes");

app.use("/api/auth/employees", employeeRoutes);
app.use("/api/html", htmlRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth/audit-logs", auditLogRoutes);

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