const fs = require("fs");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Exception = require("../utils/Exception/Exception");
const HTTP_STATUS_CODES = require("../utils/Constants/HttpStatusCode");
const userSchema = new mongoose.Schema({
  profile: {
    type: String,
    required: true,
    default: process.env.DEFAULT_PROFILE_LINK,
  },

  name: {
    type: String,
    trim: true,
    index: true,
  },

  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },

  emailOrPhone: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  birthDate: {
    type: Date,
  },

  followers: [
    {
      users: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      status: {
        type: String,
        enum: ["pending", "accepted"],
      },
    },
  ],

  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  bio: {
    type: String,
    default: "",
  },

  website: {
    type: String,
    default: "",
  },

  privacySettings: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Privacy",
  },

  refreshTokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],

  createdAt: {
    type: Date,
    defaul: Date.now(),
  },
});

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      return next();
    }
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.getRefreshToken = async function () {
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
  const REFRESH_TOKEN_VALIDITY = process.env.REFRESH_TOKEN_VALIDITY;

  const token = jwt.sign(
    {
      uid: this._id.toString(),
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_VALIDITY.toString() }
  );

  this.refreshTokens = this.refreshTokens.concat({ token: token });
  this.save();
  return token;
};

userSchema.methods.getAccessToken = async function () {
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  const ACCESS_TOKEN_VALIDITY = process.env.ACCESS_TOKEN_VALIDITY;

  const token = jwt.sign(
    {
      uid: this._id.toString(),
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_VALIDITY.toString() }
  );

  return token;
};

userSchema.statics.isEmailOrPhoneExists = async function (emailorPhone) {
  return (await this.find({ emailOrPhone: emailorPhone }).count()) > 0;
};

userSchema.statics.isUsernameExists = async function (username) {
  return (await this.find({ username: username }).count()) > 0;
};

userSchema.statics.loginUser = async function (username, password) {
  const user = await this.findOne({
    $or: [{ emailOrPhone: username }, { username: username }],
  });

  if (!user) return null;

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) return null;

  return user;
};

const User = mongoose.model("User", userSchema);

//watching changes that happen on document
const userStream = User.watch();

module.exports = { userStream };
module.exports = User;
