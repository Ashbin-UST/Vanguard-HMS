const mongoose = require("mongoose")
const Counter = require("./Counter")


const nodeSchema = new mongoose.Schema({
    nodeId:{
        type:String,
        
        unique:true
    },
    name:{
         type:String,
         unique:true,
        required:true
       

    },
    roles:{
         type:[
            {type:String,enum:[],required:true}
         ],
        
    },
    url:{
        type:String,
        required:true
    }
});



nodeSchema.pre('save', async function (next) {
    if (this.isNew) {
        
            const counter = await Counter.findOneAndUpdate(
                { name: 'Node' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.employeeId = `N-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
         
    }
   
});
module.exports = mongoose.model('Node', nodeSchema);