// Bill
 
// id
// patientId
// appointmentId (optional)
// items[] (serviceName, amount)
// total
// status → PENDING | PAID | PARTIAL
// createdByEmployeeId → Employee (cashier/admin)
 
const mongoose = require("mongoose"); 
const Counter = require("./Counter");
 
const billSchema = new mongoose.Schema({
    billId:{
        type:String,
        required:true,
        unique:true
    },
    patientId:{
        type:String,
        required:true,
        ref:'Patient'
    },
    appointmentId:{
        type:String,
        required:false,
        ref:'Appoinment'
    },
    items:[
        {
            serviceName:{type:String,required:true},
            amount:{type:Number,required:true}
        }

    ],
    total:{
      type:Number,
      required:true
    },
    status:{
        type:String,
        enum:['PENDING','PAID','PARTIAL'],
        default:'PENDING'
    },
    createdByEmployeeId:{
        type:String,
        required:true,
        ref:'Employee'
    },
},
{
    timestamps:{createdAt:'created_at'}
});

billSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'Bill' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.billId = `B-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
module.exports = mongoose.model('Bill',billSchema);