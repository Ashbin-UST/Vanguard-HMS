const Employee = require("../models/employeeModel");

exports.createEmployee = async (req, res) => {
  try{
    const {
      name,
      phone,
      email,
      department,
      designation,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
      joiningDate,
      status,
    } = req.body;

    if(!name || !phone || !email || !department || !designation ||!medicalRegistrationNo) {
      return res.status(400).json({
        success: false,
        message: 'Some fields are missing',
      });
    }

    const existingPhone = await Employee.findOne({phone}); 
    if(existingPhone) {
      return res.status(409).json({
        success: false,
        message: `Employee with phone number "${phone}" already exists`,
      });
    }

    const existingEmail = await Employee.findOne({email: email.toLowerCase().trim(),}); 
    if(existingEmail) {
      return res.status(409).json({
        success: false,
        message:  `Employee with email "${email}" already exists`,
      });
    }

    const existingRegNo = await Employee.findOne({medicalRegistrationNo}); 
    if(existingRegNo) {
      return res.status(409).json({
        success: false,
        message: `Employee with Medical Registration No "${medicalRegistrationNo}" already exists`,
      });
    }


    const employee = new Employee({
      name,
      phone,
      email,
      department,
      designation,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
      joiningDate,
      status,
    });

    const savedEmployee = await employee.save();
    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: savedEmployee,
    });

  }
  catch(error){
    console.log('Employee Controller Error: ', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during creating Employee',
    });
  }
};