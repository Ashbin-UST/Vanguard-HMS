const mongoose = require("mongoose");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const buildEmployeeProfile = require("../utils/buildEmployeeProfile");

// Get current logged in user
exports.getProfile = async (req, res) => {

    try{
        const employee = await Employee.findOne({
            employeeCode: req.user.employeeCode
        })
        .select("-__v");

        if (!employee){
            return res.status(404).json({
                message: "Employee not found!!"
            });
        }

        const profile = buildEmployeeProfile(employee);

        res.status(200).json({
            message: "Profile retrieved successfully",
            profile
        });

    }
    catch(err){
        console.error("Error during profile retrieval: ", err);
        res.status(500).json({
            message: "Server error during profile retrieval"
        });
    }
}

