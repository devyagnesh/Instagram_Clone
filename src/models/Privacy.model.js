const mongoose = require("mongoose");

const privacySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
  },

  isPrivate: {
    type: Boolean,
    enum: [true, false],
    default: false,
    required: true,
  },

  blockedAccounts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  date: {
    type: Date,
    default: Date.now(),
  },
});

const Privacy = mongoose.model("Privacy", privacySchema);

module.exports = Privacy;
