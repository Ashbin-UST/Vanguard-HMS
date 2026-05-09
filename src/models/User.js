

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {   
        email: {type: String,required: true,unique: true,lowercase: true,trim: true,},
        passwordHash: {type:String,required:true},
        status: {type:String,enum:['ACTIVE','INACTIVE']},
        role : {type:String,enum:['OWNER','ADMIN','DOCTOR','RECEPTIONIST','CASHIER','NURSE' ,'LAB_TECH ','PHARMACIST']},
        employeeId: {type:String},
        createdAt: {type:Date,default:null},
        lastLoginAt:{type:Date,default:null}
    }
)

module.exports = mongoose.model('User',userSchema);