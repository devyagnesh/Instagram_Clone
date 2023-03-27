const jwt = require("jsonwebtoken");
const Exception = require("../utils/Exception/Exception");
const HTTP_STATUS_CODES = require("../utils/Constants/HttpStatusCode");
const User = require("../models/User.model");

/*
    authentication middleware that checkses wether user is loggedin or not
 */
const Authentication = async function (req, res, next) {
  try {
    // Get token from header
    const header = req.headers.authorization;
    const token = header && header.split(" ")[1];
    const refreshToken = req.cookies?.ref;

    if (!header || !token || !refreshToken) {
      throw Exception(HTTP_STATUS_CODES["FORBIDDEN"], "FORBIDDEN", [
        {
          message: "Unauthenticated request",
          status: "failed",
        },
      ]);
    }

    //verify token token
    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    jwt.verify(token, ACCESS_TOKEN_SECRET, async function (err, user) {
      try {
        if (err) {
          throw Exception(HTTP_STATUS_CODES["FORBIDDEN"], "FORBIDDEN", [
            {
              message: "Unauthenticated request",
              status: "failed",
            },
          ]);
        }

        //if token verified successfully token will return decoded data in this case is user id after getting user id check user is exists in database
        const userExists = await User.findById({ _id: user.uid });

        if (!userExists) {
          throw Exception(HTTP_STATUS_CODES["FORBIDDEN"], "FORBIDDEN", [
            {
              message: "Unauthenticated request",
              status: "failed",
            },
          ]);
        }

        // if user exists check refresh token in database matched with refresh token that we have stored in cookie
        const checkToken = userExists.refreshTokens.find(
          (token) => token.token === refreshToken
        );

        if (!checkToken) {
          throw Exception(HTTP_STATUS_CODES["FORBIDDEN"], "FORBIDDEN", [
            {
              message: "Unauthenticated request",
              status: "failed",
            },
          ]);
        }

        //if everything is ok then user is correct user and is truly loggedin
        req.user = user;
        req.refreshToken = refreshToken;
        next();
      } catch (error) {
        return next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = Authentication;
