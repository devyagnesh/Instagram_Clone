const fs = require("fs");
const path = require("path");
const User = require("../models/User.model");

const Validator = require("../utils/Validator/Validator");
const Response = require("../utils/Response/Response");
const Exception = require("../utils/Exception/Exception");
const HTTP_STATUS_CODES = require("../utils/Constants/HttpStatusCode");
const { $where } = require("../models/User.model");

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
        // do nothing
      }
    );

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

const FollowAccount = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { userToFollowId } = req.body;

    if (!userToFollowId) {
      throw Exception(HTTP_STATUS_CODES["NOT_FOUND"], "NOT_FOUND", [
        {
          message: "account not found",
          status: "failed",
        },
      ]);
    }

    //fetch data of user to follow with privacy settings
    const isPrivateUser = await User.findById(userToFollowId).populate(
      "privacySettings"
    );

    //check if account exists or not if not send error response
    if (!isPrivateUser) {
      throw Exception(HTTP_STATUS_CODES["NOT_FOUND"], "NOT_FOUND", [
        {
          message: "account not found",
          status: "failed",
        },
      ]);
    }

    // prevent self following
    if (userToFollowId === userId) {
      throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "couldn't follow account 2 ",
          status: "failed",
        },
      ]);
    }

    //check if the user has already sent the request
    const hasPendigRequest = isPrivateUser.followers.filter((user) => {
      return user?.users?.toString() === userId;
    });

    if (hasPendigRequest.length === 0) {
      //if account found then check if user account is private or not if private then add user who sent the request other user in  followers list and set the status to pending
      if (isPrivateUser?.privacySettings?.isPrivate) {
        isPrivateUser.followers.push({ users: userId, status: "pending" });
        await isPrivateUser.save();

        return res.status(HTTP_STATUS_CODES["OK"]).json(
          Response.success(HTTP_STATUS_CODES["OK"], "OK", {
            success: {
              message: "request send",
              status: "ok",
            },
          })
        );
      }

      //if the account is not private then add the user who sent the request into following array
      const getCurrentUser = await User.findById(userId);
      getCurrentUser.following.push(userToFollowId);
      await getCurrentUser.save();

      //add the the user that has sent a request to a other user
      isPrivateUser.followers.push({ users: userId, status: "accepted" });
      await isPrivateUser.save();

      return res.status(HTTP_STATUS_CODES["OK"]).json(
        Response.success(HTTP_STATUS_CODES["OK"], "OK", {
          success: {
            message: "followed",
            status: "ok",
          },
        })
      );
    }

    return res.status(HTTP_STATUS_CODES["OK"]).json(
      Response.success(HTTP_STATUS_CODES["OK"], "OK", {
        success: {
          message: "following",
          status: "ok",
        },
      })
    );
  } catch (error) {
    return next(error);
  }
};

const unFollowAccount = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { userIdToUnfollow, isAgreed } = req.body;

    //remove current user who is following to other account from `following` list
    if (isAgreed && isAgreed == true) {
      const currentLoggedinUser = await User.findById(userId).populate(
        "following"
      );

      if (userIdToUnfollow === userId) {
        throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
          {
            message: "couldn't follow account",
            status: "failed",
          },
        ]);
      }

      // check the user who want to unfollow other user is in followers list of other user
      const isInFollowersList = currentLoggedinUser.following.filter((user) =>
        user.followers.filter((followingUser) => {
          return (
            followingUser.users.toString() === userId &&
            user._id.toString() === userIdToUnfollow.toString()
          );
        })
      );

      //check if other user id is in following list this is to make sure the consistency between data

      if (isInFollowersList.length === 1) {
        const isUnFollowed = await User.findByIdAndUpdate(
          { _id: userIdToUnfollow.toString() },
          {
            $pull: { followers: { users: userId.toString() } },
          }
        );

        if (isUnFollowed) {
          currentLoggedinUser.following.pop(userIdToUnfollow);
          await currentLoggedinUser.save();
        }

        return res.status(HTTP_STATUS_CODES["OK"]).json(
          Response.success(HTTP_STATUS_CODES["OK"], "OK", {
            success: {
              message: "Unfollowed",
              status: "ok",
            },
          })
        );
      }
    }
    return res.status(HTTP_STATUS_CODES["OK"]).json(
      Response.success(HTTP_STATUS_CODES["OK"], "OK", {
        success: {
          message: "discarded",
          status: "ok",
        },
      })
    );
  } catch (error) {
    return next(error);
  }
};

const ConfirmRequest = async (req, res, next) => {
  try {
    //step 1 get id of user who sent us request
    const { id } = req.body;

    //makesure id is not empty
    if (!id) {
      throw Exception(HTTP_STATUS_CODES["NOT_FOUND"], "NOT_FOUND", [
        {
          message: "account not found",
          status: "failed",
        },
      ]);
    }

    //step2 get current loggedin user
    const loggedInUser = req.user.uid;

    //get followers list from current loggedin user
    const currentUser = await User.findById(loggedInUser);

    //check property following is empty or not if it is empty then nobody sent a request
    if (currentUser.followers.length === 0) {
      //there is not account id in following it means there is no account so send error response
      throw Exception(HTTP_STATUS_CODES["NOT_FOUND"], "NOT_FOUND", [
        {
          message: "account not found",
          status: "failed",
        },
      ]);
    }

    //if there is accounts id in follower's list then check the perticular id is in the list and if id is in the list and status is pending then user has pending request
    const isPending = currentUser.followers.filter((follower) => {
      return follower.users.toString() === id && follower.status === "pending";
    });

    //if there is no account id matching with req.body that means there is no account that has sent a request to user
    if (isPending.length === 0) {
      throw Exception(HTTP_STATUS_CODES["NOT_FOUND"], "NOT_FOUND", [
        {
          message: "account not found 2",
          status: "failed",
        },
      ]);
    }

    //checke if request is alredy confirmed
    const isAccepted = currentUser.followers.filter((follower) => {
      return follower.users.toString() === id && follower.status === "accepted";
    });

    //if item does not found with above condition but found in pending then accept the request
    if (isAccepted.length === 0 && isPending.length === 1) {
      //accept request
      const updateStatus = await User.findOneAndUpdate(
        {
          "followers.users": id,
        },
        { $set: { "followers.$.status": "accepted" } },
        { new: true }
      );

      updateStatus.followers.forEach(async (follower) => {
        try {
          if (
            follower.users.toString() === id &&
            follower.status === "accepted"
          ) {
            await User.findByIdAndUpdate(id, {
              $push: { following: updateStatus._id.toString() },
            });

            return res.status(HTTP_STATUS_CODES["OK"]).json(
              Response.success(HTTP_STATUS_CODES["OK"], "OK", {
                success: {
                  message: "accepted",
                  status: "ok",
                },
              })
            );
          }

          throw Exception(
            HTTP_STATUS_CODES["INTERNAL_SERVER_ERROR"],
            "INTERNAL_SERVER_ERROR",
            [
              {
                message: "something went wrong",
                status: "failed",
              },
            ]
          );
        } catch (error) {
          return next(error);
        }
      });
    }
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
  FollowAccount,
  unFollowAccount,
  ConfirmRequest,
};
