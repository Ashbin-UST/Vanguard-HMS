require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose"); 

const app = express(); 
app.use(express.json());
app.use(helmet());
app.use(
    cors({
        origin:process.env.FRONTEND_URL,
        credentials:true,
    }),
); 

app.use(morgan("dev"));




const authRoutes = require("./routes/authRoutes");
app.use("/api/auth",authRoutes) 

mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>{
     console.log("MongoDB connected");
  })
  .catch((err) => console.error("MongoDB connection error:", err.message));

  console.log(mongoose.connection.name);
module.exports = app; 