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
        origin: "http://localhost:4200",
        credentials:true,
    }),
); 
app.use(morgan("dev"));


const authRoutes = require("./routes/authRoutes");
app.use("/api/auth",authRoutes);

const employeeRoutes = require("./routes/employeeRoutes")
app.use("/api/employees",employeeRoutes);

const nodeRoutes = require("./routes/nodeRoutes")
app.use("/api/node",nodeRoutes)


const startServer = async ()=>{
try{
 await mongoose.connect(process.env.MONGO_URI)
console.log("MongoDB connected");

}
  catch(err) { 
    console.error("MongoDB connection error:", err.message);
  }
} 
startServer();
module.exports = app; 