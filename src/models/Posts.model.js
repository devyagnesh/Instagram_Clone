const mongoose = require("mongoose");
const crypto = require("crypto");

const postSchema = new mongoose.Schema({
  postid: {
    type: String,
    required: true,
    default: crypto.randomBytes(12).toString("hex"),
  },

  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  media: [
    {
      url: {
        type: String,
      },

      mimeType: {
        type: String,
      },
    },
  ],

  caption: {
    type: String,
    trim: true,
  },

  altText: {
    type: String,
    trim: true,
  },

  dateOfUpload: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const Posts = mongoose.model("Post", postSchema);

module.exports = Posts;
