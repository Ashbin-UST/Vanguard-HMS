const employeeModel = require("../models/Employees");
const userModel = require("../models/Users");
const createAuditLog = require("../utils/createAuditLog");
exports.getAllEmployees = async (req, res) => {
    try{

        //add specialization and department to the employee details from Users. EmployeeCode is present in both  models and send it as response
        const employees=await employeeModel.find();
        const User=await userModel.find();
        for(let i=0;i<employees.length;i++){
            const employee=employees[i];
            const user=User.find(u=>u.employeeCode===employee.employeeCode);
            if(user){
                employee.specialization=user.specialization;
                employee.department=user.department;

        }
        console.log(employee);
        res.status(200).json(employees);}
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getEmployeeById = async (req, res) => {

};
exports.createEmployee = async (req, res) => {
    try{
        const { name, employeeCode, specialization, department } = req.body;
        const employee = new employeeModel({
            name,
            employeeCode,specialization,department});
            employee.save();
        const user = new userModel({
            employeeCode,
                roles: ["DOCTOR"],

        });

        user.save();
        res.status(201).json({ message: "Employee created successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateEmployee = async (req, res) => {};
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await employeeModel.findById(req.params.id).lean();

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // Delete employee
    await employeeModel.findByIdAndDelete(req.params.id);

    // Delete user linked to employee
    const user = await userModel.findOne({
      employeeCode: employee.employeeCode
    }).lean();

    if (user) {
      await userModel.deleteOne({ _id: user._id });
    }

    // ✅ Audit: Employee deletion
    await createAuditLog({
      req,
      action: "DELETE",
      collectionName: "Employees",
      targetId: employee._id,
      targetUserId: employee._id,
      before: employee,   // ✅ important
    });

    // ✅ Audit: User deletion (if exists)
    if (user) {
      await createAuditLog({
        req,
        action: "DELETE",
        collectionName: "Users",
        targetId: user._id,
        targetUserId: user._id,
        before: user   // ✅ important
      });
    }

    res.status(200).json({
      message: "Employee deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
