const mongoose = require("mongoose");
const appointment = require("./appointment");

const medicalRecordsSchema = new mongoose.Schema ({

    appointmentId : {type:String, required: true},
    patientId : {type:String, required : true},
    doctorEmployeeId : {type:String, required: true},
    symptoms : {type: String},
    diagnosis : {type:String},
    prescription : {type: String, enum : ["name", "dosage", "duration"]},
    notes : {type:String},
    createdAt : {createdAt: 'created_at'}
});

module.exports = mongoose.model('medicalRecords', medicalRecordsSchema)