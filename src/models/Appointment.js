 
// Appointment
 
// id
//appointment id
// patientId → Patient
// doctorEmployeeId → Employee (designation Doctor)
// date
// timeSlot
// status → BOOKED | CANCELLED | COMPLETED
// createdByEmployeeId → Employee (Receptionist / Admin) 

const mongoose = require("mongoose");
const  Counter = require("./Counter");

const appointmentSchema = new mongoose.Schema({ 
    apppoinmentId:{
        type:String,
        required:true,
        unique:true
    },
    patientId:{
        type:String,
        required:true, 
        ref:'Patient'
    },
    doctorEmployeeId:{
        type:String,
        required:true,
        ref:'Employee'
    },
    date:{
        type:Date,
        required:true
    },
    timeSlot:{
        startTime:{
                type:String,
                required:true
            },
            endTime:{
                type:String,
                required:true
            }
    },
    status:{
        type:String,
        enum:['BOOKED','CANCELLED','COMPLETED']
    },
     createdByEmployeeId:{
        type:String,
        required:true,
        ref:'Employee'
    }
},
{
    timestamps:{createdAt:'created_at'}
});

appointmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'appointment' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.appointmentId = `APP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
module.exports = mongoose.model('Appointment',appointmentSchema);