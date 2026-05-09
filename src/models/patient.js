const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({

    UHID: {type:String, unique: true, required: true},
    patientname: {type:String, required:true},
    phone: {type:String, required:true},
    email: {type:String, required:true},
    gender: {type:String, enum: ["female","male"]},
    dob: {type:Date},
    address: {type:String, required:true},
    emergencyContact: {type:String, relation: {type: String}, phone: {type:String}}, //OPTIONAL
    status: {type:String, enum:["ACTIVE","INACTIVE"]}
});

patientSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'patient' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.UHID = `PN-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});

exports.mongoose = mongoose.models('patient', patientSchema)