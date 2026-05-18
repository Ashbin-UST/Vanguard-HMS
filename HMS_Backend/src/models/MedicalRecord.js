// id
// appointmentId
// patientId
// doctorEmployeeId
// symptoms
// diagnosis
// prescriptionItems[] (name, dosage, duration)
// notes
// createdAt
const mongoose = require("mongoose"); 
const Counter = require("./Counter")
 
const medicalRecordSchema = new mongoose.Schema({
    medicalRecordId:{
        type:String,
        required:true,
        unique:true
    },
    appointmentId:{
        type:String,
        required:true,
        ref:'Appoinment'
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
    symptoms:{
        type:String,
        required:true
    },
    diagnosis:{
        type:String,
        required:true
    },
    prescriptionItems:[
        {
            name:{type:String,required:true},
            dosage:{type:String,required:true},
            duration:{type:String,required:true}
        }
    ],
    notes:{
        type:String,
        required:true
    },  
},
{
    timestamps:{createdAt:'created_at'}
});

medicalRecordSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'medicalrecord' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.medicalRecordId = `REC-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
module.exports = mongoose.model('MedicalRecord',medicalRecordSchema);