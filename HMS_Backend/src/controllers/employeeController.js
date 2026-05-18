const Employee = require("../models/Employee");
const User = require("../models/User"); 

const {findOne} = require("../models/Counter");
const { default: mongoose } = require("mongoose");

const getAllEmployees = async (req,res)=>{
    try{
    const employees = await Employee.find({
        designation:{$nin:['OWNER','ADMIN']}
    }); 
    return res.status(200).json({employees});
    }
    catch(err){
       return res.status(500).json({ message: err.message });
    }
} 

const getEmployeeById = async(req,res)=>{
    try{
        
        const employee = await Employee.find({
            employeeId:req.params.id
        });
        return res.status(200).json({employee})
    }
    catch(err){
       res.status(500).json({ message: err.message }); 
    }
} 


const addEmployee = async(req,res)=>{
    try{
        const email = req.body.email;
        const existingUser = await User.findOne({email});
        if(existingUser)
            return res.status(409).json({"message":"Email already registered"});

        const employee = new Employee(req.body)
        const savedEmployee = await employee.save();
        return res.status(201).json({savedEmployee})
    }
    catch(err){
       res.status(500).json({ message: err.message }); 
    }
} 

const deleteEmployee = async (req,res)=>{
    try{
        await Employee.findOneAndDelete({
            employeeId:req.params.id
        });
      
    }
    catch(err){
       res.status(500).json({ message: err.message }); 
    }
} 


const updateEmployee = async (req,res)=>{
    try{
        const updatedemployee = await Employee.findOneAndUpdate(
            {employeeId:req.params.id},
            req.body,
            {new:true}
        );
    return res.status(200).json(updatedEmployee);
    }
    catch(err){
       res.status(500).json({ message: err.message }); 
    }

}
module.exports = {getAllEmployees,getEmployeeById,addEmployee,deleteEmployee,updateEmployee}
