const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    action: {
      type: String,
      enum: ["CREATE", "READ", "UPDATE", "DELETE","ADD"],
      required: true
    },
    actor:{
type:String

    },
    actorRole:{
      type:[String],
      
    },

    collectionName: {
      type: String,
      required: true
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    before: {
      type: mongoose.Schema.Types.Mixed
    },

    after: {
      type: mongoose.Schema.Types.Mixed
    },

    changedFields: {
      type: mongoose.Schema.Types.Mixed
    },

    request: {
      ip: String,
      userAgent: String,
      method: String,
      path: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);