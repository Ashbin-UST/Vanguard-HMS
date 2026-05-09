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

// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({

//         email : {type: String, unique: true, required: true, lowercase: true, trim: true}, 
//         password_hash: {type: String, required: true},
//         status: { type: Boolean, default: true},
//         roles: {type: String, enum: ["OWNER", "ADMIN", "DOCTOR", "RECEPTION", "CASHIER", "NURSE", "LAP_TECH", "PHARMACIST"], required: true},
//         employeeId: {type:String , required : true},
//         lastLoginAt: {type: Date}
// },
//       {  timeStamps: {createdAt: 'created_at', updateAt: 'updated_at'} 
// });
// module.exports = mongoose.model('user', userSchema)
