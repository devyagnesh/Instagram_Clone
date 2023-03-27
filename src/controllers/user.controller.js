const fs = require("fs");
const path = require("path");
const User = require("../models/User.model");
const Validator = require("../utils/Validator/Validator");
const Response = require("../utils/Response/Response");
const Exception = require("../utils/Exception/Exception");
const HTTP_STATUS_CODES = require("../utils/Constants/HttpStatusCode");

const Signup = async (req, res, next) => {
  try {
    const { emailorphone, fullname, username, password } = req.body;

    if (!Validator.isEmailOrPhone(emailorphone)) {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "invalid email or phone number !",
          status: "failed",
        },
      ]);
    } else if (!Validator.isValidUsername(username)) {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "invalid username !",
          status: "failed",
        },
      ]);
    } else if (!password && password.length < 8) {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "password must have at least 8 characters",
          status: "failed",
        },
      ]);
    }

    const isUserExists = await User.isEmailOrPhoneExists(emailorphone);

    if (isUserExists) {
      throw Exception(HTTP_STATUS_CODES["CONFLICT"], "CONFLICT", [
        {
          error: {
            message: "account already exists !",
            status: "failed",
          },
        },
      ]);
    }

    const isUsernameExists = await User.isUsernameExists(username);

    if (isUsernameExists) {
      throw Exception(HTTP_STATUS_CODES["CONFLICT"], "CONFLICT", [
        {
          error: {
            message: `username ${username} is not available`,
            status: "failed",
          },
        },
      ]);
    }
    const newUser = new User({
      emailOrPhone: emailorphone,
      name: fullname,
      username: username,
      password: password,
    });

    const Reftoken = await newUser.getRefreshToken();
    const accessToken = await newUser.getAccessToken();
    //set refreshToken in cookie
    res.cookie("ref", Reftoken, {
      expires: new Date(Date.now() + 3600000 * 24 * 90),
      path: "/",
      httpOnly: true,
    });
    return res.status(HTTP_STATUS_CODES["CREATED"]).json(
      Response.success(HTTP_STATUS_CODES["CREATED"], "CREATED", {
        success: {
          message: "account created !",
          accessToken: accessToken,
          status: "ok",
        },
      })
    );
  } catch (error) {
    console.log(error.stack);
    return next(error);
  }
};

const Login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!Validator.isValidEmailOrPhoneOrUsername(username)) {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "invalid username",
          status: "failed",
        },
      ]);
    } else if (!password) {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "please enter a password",
          status: "failed",
        },
      ]);
    }

    const user = await User.loginUser(username, password);

    if (!user) {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "incorrect username or password",
          status: "failed",
        },
      ]);
    }

    const Reftoken = await user.getRefreshToken();
    const accessToken = await user.getAccessToken();
    res.cookie("ref", Reftoken, {
      expires: new Date(Date.now() + 3600000 * 24 * 90),
      path: "/",
      httpOnly: true,
    });
    return res.status(HTTP_STATUS_CODES["OK"]).json(
      Response.success(HTTP_STATUS_CODES["OK"], "OK", {
        success: {
          message: "logged in",
          accessToken: accessToken,
          status: "ok",
        },
      })
    );
  } catch (error) {
    return next(error);
  }
};

const Logout = async function (req, res, next) {
  try {
    //simply remove the refresh token from data base and cookie
    await User.findByIdAndUpdate(req.user.uid, {
      $pull: { refreshTokens: { token: req.refreshToken } },
    });

    return res.status(HTTP_STATUS_CODES["OK"]).json(
      Response.success(HTTP_STATUS_CODES["OK"], "OK", {
        success: {
          message: "logged out",
          status: "ok",
        },
      })
    );
  } catch (error) {
    return next(error);
  }
};

const updateBirthDate = async function (req, res, next) {
  try {
    const { birthDate } = req.body;

    if (new Date(birthDate) === "Invalid Date") {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "invalid date !",
          status: "failed",
        },
      ]);
    }

    const dob = new Date(birthDate);
    const monthDiff = Date.now() - dob.getTime();
    const ageDate = new Date(monthDiff);
    const getYear = ageDate.getUTCFullYear();
    const age = Math.abs(getYear - 1970);

    if (age < 18) {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "your age should be at least 18 or more to use our service",
          status: "failed",
        },
      ]);
    }

    const FormatedDate = new Intl.DateTimeFormat("en-IN").format(dob);
    const userId = req.user.uid;
    await User.findByIdAndUpdate(userId, { $set: { birthDate: FormatedDate } });
    return res.status(HTTP_STATUS_CODES["OK"]).json(
      Response.success(HTTP_STATUS_CODES["OK"], "OK", {
        success: {
          message: "updated",
          status: "ok",
        },
      })
    );
  } catch (error) {
    return next(error);
  }
};

const UpdateProfile = async (req, res, next) => {
  try {
    if (!req.file || !req.file?.uploadPath) {
      throw Exception(
        HTTP_STATUS_CODES["INTERNAL_SERVER_ERROR"],
        "INTERNAL_SERVER_ERROR",
        [
          {
            message: "something went wrong !",
            status: "failed",
          },
        ]
      );
    }
    const profileUrl = `${req.protocol}://${req.hostname}:${process.env.LISTEN_PORT}/${req.file.uploadPath}`;

    await User.findByIdAndUpdate(req.user.uid, {
      $set: { profile: profileUrl },
    });

    return res.status(HTTP_STATUS_CODES["OK"]).json(
      Response.success(HTTP_STATUS_CODES["OK"], "OK", {
        success: {
          message: "updated",
          status: "ok",
        },
      })
    );
  } catch (error) {
    fs.unlink(
      path.join(__dirname, "../../", "/upload/profile/", req.file.uploadPath),
      function (err) {
        console.log(err);
      }
    );

    console.log("\n\n === ERROR : ", error);
    return next(error);
  }
};

const RemoveProfile = async (req, res, next) => {
  try {
    //get link of profile
    const previosUrlLink = await User.findById(req.user.uid).select("profile");

    //check if profile link includes default or not if it includes default then do not delete the image from disk if it does not include default then remove it
    if (!previosUrlLink?.profile?.includes("default")) {
      fs.unlink(
        path.join(
          __dirname,
          "../../",
          "/upload/profile/",
          previosUrlLink?.profile?.slice(
            previosUrlLink?.profile?.lastIndexOf("/")
          )
        ),
        function (err) {
          if (err) {
            throw Exception(
              HTTP_STATUS_CODES["INTERNAL_SERVER_ERROR"],
              "INTERNAL_SERVER_ERROR",
              [
                {
                  message: "something went wrong !",
                  status: "failed",
                },
              ]
            );
          }
        }
      );
    }

    //update the collection with default profile link
    await User.findByIdAndUpdate(
      req.user.uid,
      {
        $set: { profile: process.env.DEFAULT_PROFILE_LINK },
      },
      { returnOriginal: true }
    );

    return res.status(HTTP_STATUS_CODES["OK"]).json(
      Response.success(HTTP_STATUS_CODES["OK"], "OK", {
        success: {
          message: "removed",
          status: "ok",
        },
      })
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  Signup,
  Login,
  Logout,
  updateBirthDate,
  UpdateProfile,
  RemoveProfile,
};
