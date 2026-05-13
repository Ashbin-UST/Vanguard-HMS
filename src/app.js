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




const startserver = async () =>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected")
  }
  catch(err) { console.error("MongoDB connection error:", err.message);}
}

  startserver();
module.exports = app; 