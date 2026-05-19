const mongoose = require(mongoose);
 
const appointmentSchema = new mongoose.Schema({
    appointmentId : {type:String, required : true},
    patientId : { type : String, required : true, unique : true},
    doctorEmployeeId :{ type : String, required : true , unique : true},
    date : { type : Date },
    timeSlot : { type : String},
    status : { type : String , enum :["BOOKED" , "CANCELLED", "COMPLETED"], required: true},
    createdByEmployeeId : { type : String} //Receptionist / Admin
});
appointmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'appointment' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.appointmentId = `APT-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});


module.exports = mongoose.model("Appointment", appointmentSchema);