const mongoose = require("mongoose");

const privacySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
});

const Privacy = mongoose.model("Privacy", privacySchema);
