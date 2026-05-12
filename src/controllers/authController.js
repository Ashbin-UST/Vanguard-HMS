const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
 
 
const Employee = require("../models/Employee");
const User = require("../models/User")
 
exports.signup = async (req,res)=>{
 
    try{
       const{ email,
        password,
        name,
        phone,
        department,
        designation,
        status,
        joiningDate,
        medicalRegistrationNumber,
        specialisation,
        qualification,
        consultationFee,
        availabilitySlots} = req.body;
         
        const existingUser = await User.findOne({ email });
        if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
        }
       
 
        const password_hash = await bcrypt.hash(password,12);
 
        // let profile = null;
 
        const employee = new Employee();
        employee.email = email;
        employee.name = name;
        employee.phone = phone;
        employee.department = department;
        employee.designation = designation;
        employee.status = status;
        employee.joiningDate = joiningDate;
        employee.medicalRegistrationNumber = medicalRegistrationNumber;
        employee.specialisation = specialisation;
        employee.qualification=qualification;
        employee.consultationFee = consultationFee;
        employee.availabilitySlots = availabilitySlots;
       
        const savedEmployee = await employee.save();
       
       
        //alternative  
        //const employee = await Employee.create(req.body);
 
       
        // Generate verification token
    // const verification_token = crypto.randomBytes(32).toString("hex");
    // const verification_token_expiry = new Date(
    //   Date.now() + 24 * 60 * 60 * 1000,
    // ); // 24 hours
 
     const user = await User.create({
      email,
      passwordHash:password_hash,
      role:designation,
      employeeId: savedEmployee.employeeId,
      //verification_token,
      //verification_token_expiry,
    });
 
    // const token = jwt.sign(
    //   { id: user.employeeId, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRES_IN },
    // );
   
    res.status(201).json({
      message:
        "Account created successfully. ",
     // token,
     
    });
 
 
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
   
}

// ________________LOGIN______________________

exports.login = async (req,res)=>{
  try{
    const {email,password} = req.body;

    const user = await User.findOne({email});
    if(!user)
      return res.status(401).json({message:"Invalid email"}); 

    const isMatch = await bcrypt.compare(password,user.passwordHash);
    if(!isMatch){
      return res.status(401).json({message:"Invalid email or password"})
    } 
    user.lastLoginAt = new Date();
    await user.save(); 

    const token = jwt.sign(
      { id: user.employeeId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );  
    
    const profile = await Employee.findOne({employeeId:user.employeeId});


    res.status(200).json({
      message:"Login successful",
      token,
      user,
    });

  }
  catch(err){
    res.status(500).json({message:err.message})

  }
}
// _____________________ME__________________
exports.getProfile = async (req, res) => {

  try {

    const user = await User.findOne({employeeId:req.user.id})
      .select("-passwordHash -__v");

    if (!user) {

      return res.status(404).json({
        message: "User not found"
      });
    }

    const employee = await Employee.findOne({
      employeeId: user.employeeId
    }).select("-__v");

    return res.status(200).json({
      success: true,
      user,
      employee
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}