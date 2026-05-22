const mongoose = require("mongoose");
const Counter = require("./Counter");

const nodeSchema = new mongoose.Schema(
    {
        
nodeId: { type: String, unique: true },

  name: { type: String, required: true, trim: true },

  url: { type: String, required: true, unique: true },

  logo: {type: String,
  default: "📌"
},

identifier: {
  type: String,
  required: true,
  unique: true
},

order: {
  type: Number,
  default: 0
},

isActive: {
  type: Boolean,
  default: true
}
,
  roles: [{
    type: String,
    enum: [
      "OWNER",
      "ADMIN",
      "DOCTOR",
      "RECEPTIONIST",
      "CASHIER",
      "NURSE",
      "LAB_TECH",
      "PHARMACIST"
    ],
    required: true
  }]
},

    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

// Pre-save hook to generate sequential ID
nodeSchema.pre("save", async function () {
    if (this.isNew) {
                const counter = await Counter.findOneAndUpdate(
                    { name: 'node' },
                    { $inc: { seq: 1 } }, // Creates sequence
                    { new: true, upsert: true } // upsert is update and insert
                );
                this.nodeId = `NODE-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        }
});

module.exports = mongoose.model("Node", nodeSchema);