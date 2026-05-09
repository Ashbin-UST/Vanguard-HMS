// const express = require(express);
// const route = express.Route();
// const Employee = require("../models/employee");
// const Patient = require("../models/patient");
// const Dcotor = require("../models/doctor");
// const user = require("../models/user");



// exports.Signup = async (req,res) => {
//     try{
//         const{
//             employeeId,
//                 employeeCode,
//                 employeeName,
//                 phone,
//                 email,
//                 department,
//                 designation,
//                 status,
//                 joiningDate,
//                 medicalRegistrationNo,
//                 specialization,
//                 qualification,
//                 consultationFee,
//                 availabilitySlots
//         } = req.body;
//         const existingEmployee = await Employee.findOne({ employeeId });
//         if(existingEmployee){
//             return res.status(409).json({ message: "EmployeeId already exist"});
//         }
//         const password_hash = await bcrypt.hash(password, 12);

//         let profile = null;
//          if(role === "patient"){
//             profile = await patient.create({
//                 UHID,
//             patientname,
//             phone,
//             email,
//             gender,
//             dob,
//             address,
//             emergencyContact,
//             status
//             });
//          }
//          else if(role === "doctor"){
//             profile = await doctor.create({
                

//             })
//          }
//     } 
// }