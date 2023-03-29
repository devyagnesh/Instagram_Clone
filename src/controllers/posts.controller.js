const fs = require("fs");
const { Readable } = require("stream");
const crypto = require("crypto");
const multer = require("multer");
const Posts = require("../models/Posts.model");
const Exception = require("../utils/Exception/Exception");
const Response = require("../utils/Response/Response");
const HTTP_STATUS_CODE = require("../utils/Constants/HttpStatusCode");
const VideoUtility = require("../utils/videoUtility/videoProcessor");
const path = require("path");
const sharp = require("sharp");
const ImageUtility = require("../utils/ImageUtility/ImageUtility");

const storage = multer.memoryStorage({});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 650,
    fields: 10,
  },
}).any("media");

const CreatePost = async (req, res, next) => {
  try {
    //check if at least 1 media file selected
    console.log(req.files);
    if (!req.files) {
      throw Exception(HTTP_STATUS_CODE["BAD_REQUEST"], "BAD_REQUEST", [
        {
          message: "atleast 1 media file required",
          status: "failed",
        },
      ]);
    }

    //filter out the media which media type is video
    const videoFile = req?.files?.filter((media) => {
      return media.mimetype.includes("video/");
    });

    //check video requirements
    videoFile.forEach(async (video) => {
      try {
        const { buffer, mimetype } = video;

        /*
            ========= CONVERT  BUFFER FILE INTO VIDEO ==== 
            ========= STORE IT INTO DISK STORAGE ========
        */
        const mediaReadable = new Readable();
        mediaReadable._read = () => {};
        mediaReadable.push(buffer);

        const getMedia = mediaReadable.pipe(
          fs.createWriteStream(
            path.join(
              __dirname,
              "../../upload/posts/",
              `${Date.now()}_${crypto.randomBytes(64).toString("hex")}.${
                mimetype.split("/")[1]
              }`
            )
          )
        );

        /*
              ======= Get Metadata of video file =====
              
        */

        console.log(getMedia.path);
        const { duration, size, width, height } =
          await VideoUtility.getVideoInformation(getMedia.path);

        // check video requirements
        if (
          duration < 10 ||
          duration > 3600 ||
          size > 3600000000 ||
          width < 720 ||
          height < 480 ||
          mimetype !== "video/mp4"
        ) {
          fs.unlinkSync(getMedia.path);
          throw Exception(HTTP_STATUS_CODE["BAD_REQUEST"], "BAD_REQUEST", [
            {
              message: "video requirement does not matching",
              status: "failed",
            },
          ]);
        }
      } catch (error) {
        console.log(error);
        return next(error);
      }
    });

    const imageFile = req?.files?.filter((image) => {
      return image.mimetype.includes("image/");
    });

    imageFile.forEach(async (image) => {
      const { buffer, mimetype } = image;

      const { width, height } = await sharp(buffer).metadata();

      console.log(width, height);

      // if the width of the image is less then 320px then enlarge it to 320
      if (width < 320) {
        const { uploadPath } = await ImageUtility.reSizeImage(
          buffer,
          320,
          null,
          mimetype
        );

        currentImageBuffer = buffer;
      }

      // if the image width is more then 1080px , size down to 1080
      if (width > 1080) {
        const { uploadPath } = await ImageUtility.reSizeImage(
          buffer,
          1080,
          null,
          mimetype
        );
      }

      const aspectRatio = `${(width / height).toFixed(2)}:1`;
      if (aspectRatio !== "1.91:1" && aspectRatio !== "4:5") {
        const { uploadPath } = await ImageUtility.cropToAspectRation(
          buffer,
          "4:5"
        );
      }
    });
  } catch (error) {
    console.log(error);
    return next(next);
  }
};

module.exports = { CreatePost, upload };
