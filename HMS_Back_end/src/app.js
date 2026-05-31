require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const nodeRoutes = require("./routes/nodeRoutes");

const app = express();

// Used for secure HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Middleware which logs requests
app.use(morgan("dev"));

// Read JSON data sent from frontend/Postman
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/nodes", nodeRoutes);

// Default route
app.get("/", (req, res) =>
  res.json({
    message: "API running",
  })
);

module.exports = app;