const jwt = require("jsonwebtoken");
const Exception = require("../utils/Exception/Exception");
const User = require("../models/User.model");
const HTTP_STATUS_CODES = require("../utils/Constants/HttpStatusCode");
const Response = require("../utils/Response/Response");

const GetAccessToken = async function (req, res, next) {
  try {
    const token = req.cookies.ref;

    if (!token) {
      throw Exception(HTTP_STATUS_CODES["FORBIDDEN"], "FORBIDDEN", [
        {
          message: "Unauthenticated request",
          status: "failed",
        },
      ]);
    }

    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
    jwt.verify(token, REFRESH_TOKEN_SECRET, async (err, user) => {
      try {
        //get userid from decoded token
        const userId = user.uid;

        //check if user exists with matching user id
        const isUserExists = await User.findById(userId);

        //if there is no user with matching throw error
        if (!isUserExists) {
          throw Exception(HTTP_STATUS_CODES["FORBIDDEN"], "FORBIDDEN", [
            {
              message: "Unauthenticated request",
              status: "failed",
            },
          ]);
        }

        //check if token exists in user collection if token is not present there it means user is logged out
        const isTokenExists = isUserExists.refreshTokens.filter(
          (reftoken) => reftoken.token === token
        );

        if (!isTokenExists) {
          throw Exception(HTTP_STATUS_CODES["FORBIDDEN"], "FORBIDDEN", [
            {
              message: "Unauthenticated request",
              status: "failed",
            },
          ]);
        }

        //if everything is ok then generate access token and send it as response
        const accessToken = await isUserExists.getAccessToken();
        return res.status(HTTP_STATUS_CODES["OK"]).json(
          Response.success(HTTP_STATUS_CODES["OK"], "OK", {
            accessToken: accessToken,
          })
        );
      } catch (error) {
        return next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { GetAccessToken };
