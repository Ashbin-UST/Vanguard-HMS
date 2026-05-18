const mongoose = require("mongoose");
const Counter = require("./Counter")

const patientSchema = new mongoose.Schema({
UHID:{
    type:String,
    required:true,
    unique:true
},
name:{
    type:String,
    required:true
},
phone:{
    type:String,
    required:true
},
email:{
    type:String,
    required:true,
    unique:true
},
gender:{
    type:String,
    enum:['Male','Female','Other'],
},
dob:{
    type:Date,
},
address:{
   type:String

},
emergencycontact:{
    type:String
},
status:{
    type:"String",
    enum:['ACTIVE','INACTIVE'],
    default:"ACTIVE"
}
},
{
    timestamps:{createdAt:'created_at'}
});


patientSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'Patient' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.UHID = `UH-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
module.exports = mongoose.model('Patient', patientSchema);



// id
// UHID (unique hospital id)
// name
// phone, 
// email
// gender, 
// dob
// address
// emergencyContact (optional)
// status → ACTIVE | INACTIVE