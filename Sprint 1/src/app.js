require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const mongoose = require("mongoose");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use(express.json());

app.get("/api/db-status", (req, res) => {
  res.json({
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    dbName: mongoose.connection.name,
  });
});

app.use("/api/auth", authRoutes);

app.get("/", (req, res) =>
  res.json({ message: "API running" })
);

module.exports = app;