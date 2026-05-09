require("dotenv").config();
 
const express = require("express");
const mongoose = require("mongoose");
 
 
 
const app = express();
 
app.use(express.json());
 
 mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
//wdqf
.catch((err) => {
    console.log(err);
});
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
 
 
module.exports = app;