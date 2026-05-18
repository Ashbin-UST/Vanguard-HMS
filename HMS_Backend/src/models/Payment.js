// Payment
 
// id
// billId
// amount
// method → CASH | CARD | UPI
// paidAt
// receivedByEmployeeId → Employee (cashier) 



const mongoose = require("mongoose"); 
const Counter = require("./Counter");
 
const paymentSchema = new mongoose.Schema({
    paymentId:{
        type:String,
        required:true,
        unique:true
    },
    billId:{
        type:String,
        required:true,
        ref:'Bill'
    },
    
    
    amount:{
      type:Number,
      required:true
    },
    method:{
        type:String,
        enum:['CASH','CARD','UPI'],
        default:'CASH'
    },
    paidAt:{
        type:Date,
        default:Date.now
    },
    receivedByEmployeeId:{
        type:String,
        required:true,
        ref:'Employee'
    },
},
{
    timestamps:{createdAt:'created_at'}
});

paymentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'Payment' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.paymentId = `PYMT-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
module.exports = mongoose.model('Payment',paymentSchema);