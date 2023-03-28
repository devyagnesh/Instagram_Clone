const Privacy = require("../models/Privacy.model");
const User = require("../models/User.model");
const Exception = require("../utils/Exception/Exception");
const HTTP_STATUS_CODES = require("../utils/Constants/HttpStatusCode");
const Response = require("../utils/Response/Response");

const MakeAccountPrivate = async function (req, res, next) {
  try {
    const userId = req.user.uid;

    const privacy = await Privacy.findOne({ user: userId });

    if (!privacy) {
      const addPrivacy = new Privacy({
        user: userId,
        isPrivate: true,
      });

      const updatedPrivacy = await addPrivacy.save();
      await User.findByIdAndUpdate(userId, {
        $set: { privacySettings: updatedPrivacy._id },
      });
      return res.status(HTTP_STATUS_CODES["OK"]).json(
        Response.success(HTTP_STATUS_CODES["OK"], "OK", [
          {
            success: {
              message: "switched to private account",
              status: "ok",
            },
          },
        ])
      );
    }

    await Privacy.findOneAndUpdate(
      { user: userId },
      { $set: { isPrivate: false } }
    );
    return res.status(HTTP_STATUS_CODES["OK"]).json(
      Response.success(HTTP_STATUS_CODES["OK"], "OK", [
        {
          success: {
            message: "switched to public account",
            status: "ok",
          },
        },
      ])
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = { MakeAccountPrivate };
