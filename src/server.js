require('dotenv').config();

const mongoose = require('mongoose');
const app = require("./app");
const employeeRoutes = require("./routes/employeeRoutes");

const connectDB = require('./config/db.js');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is missing in .env file');
  process.exit(1); // Stop the server
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env file');
  process.exit(1);
}


const startServer = async () => {
  try {
    await connectDB();

    // Start server ONLY after DB is connected
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

startServer();