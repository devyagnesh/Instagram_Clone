const multer = require("multer");
const Exception = require("../utils/Exception/Exception");
const HTTP_STATUS_CODES = require("../utils/Constants/HttpStatusCode");
const ImageUtility = require("../utils/ImageUtility/ImageUtility");
/*
    ++++++ Multer Memory Storage ++++++
    inorder to store buffer data in memory
*/

const storage = multer.memoryStorage();

/*
  file filter function in order to validate file
 */
const fileFilter = function (req, file, callback) {
  const allowedFileType = ["image/jpeg", "image/png"];

  if (allowedFileType.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      Exception(
        HTTP_STATUS_CODES["UNSUPPORTED_MEDIA_TYPE"],
        "UNSUPPORTED_MEDIA_TYPE",
        [
          {
            message: "only jpeg or png supported",
            status: "failed",
          },
        ]
      )
    );
  }
};

/*
  multer instance with options
*/
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024,
  },
});

/*
    upload.single is method that takes only 1 file this method returns middleware function
*/
const uploadProfile = upload.single("avatar");

/*
  this is a wrapper middleware function that wrapes the middleware function is returned by upload.single('avatar)
*/
const UploadProfile = async (req, res, next) => {
  try {
    uploadProfile(req, res, async (err) => {
      try {
        /*
          check if file exists in req.file
        */
        const avatar = req.file;
        if (!avatar) {
          throw Exception(HTTP_STATUS_CODES["BAD_REQUEST"], "BAD_REQUEST", [
            {
              message: "select at least one picture",
              status: "failed",
            },
          ]);
        }

        /*
          before storing image crop it with sharp library 320 by 320 that instagram accepts
        */
        const ImageStr = await ImageUtility.cropImage(
          320,
          320,
          req.file.buffer,
          req.file.mimetype
        );

        /*
          storing images's buffer data into request object 
        */

        const filename = ImageStr.slice(ImageStr.lastIndexOf("\\") + 1);
        req.file.uploadPath = filename;
        return next();
      } catch (error) {
        return next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = UploadProfile;
