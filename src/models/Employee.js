const mongoose = require("mongoose"); 
const Counter = require("./Counter")
 
const employeeSchema = new mongoose.Schema({
    employeeId: { type: String, unique: true,trim:true,uppercase:true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true,unique:true,lowercase:true},
    department:{
        type:String,
        enum: ['OPD','IPD','LAB','PHARMACY','ADMIN'],
        required:true
    },
    designation:{
        type:String,
        enum: ['OWNER','DOCTOR','NURSE','RECEPTIONIST','CASHIER',
            'LAB_TECH','PHARMACIST','ADMIN'],
            required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE','INACTIVE'],
        default: 'ACTIVE'
    },
    joiningDate: { type: Date ,required:true},
    medicalRegistrationNumber: { type: String},
    specialisation: {type:String},
    qualification: [
        { type: String, required: true }
    ],
    consultationFee: { type: Number, default: 0 },
    availabilitySlots:[
        {
            day:{type:Date},
            startTime:{type:String},
            endTime:{type:String}
        }
    ]
});
         
 
employeeSchema.pre('save', async function (next) {
    if (this.isNew) {
        
            const counter = await Counter.findOneAndUpdate(
                { name: 'Employee' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.employeeId = `EMP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
         
    }
   
});
module.exports = mongoose.model('Employee', employeeSchema);
 