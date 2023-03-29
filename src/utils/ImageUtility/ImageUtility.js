const sharp = require("sharp");
const path = require("path");
const crypto = require("crypto");
class ImageUtility {
  static async cropImage(width, height, buffer, mimeType) {
    const croppedImage = await sharp(buffer)
      .resize(width, height, {
        fit: "cover",
      })
      .toBuffer();

    const extension = mimeType.split("/")[1];

    const fileName = `${crypto
      .randomBytes(62)
      .toString("hex")}_${Date.now()}.${extension}`;
    const uploadPath = path.join(
      __dirname,
      "../../../",
      "upload/profile/",
      fileName
    );
    await sharp(croppedImage).toFile(uploadPath);
    return uploadPath;
  }

  static async reSizeImage(buffer, maxWidth, maxHeight, mimeType) {
    const resizedImage = await sharp(buffer)
      .resize(maxWidth, maxHeight, { fit: "inside" })
      .toBuffer();

    const extension = mimeType.split("/")[1];

    const fileName = `${crypto
      .randomBytes(62)
      .toString("hex")}_${Date.now()}.${extension}`;
    const uploadPath = path.join(
      __dirname,
      "../../../",
      "upload/posts/",
      fileName
    );
    await sharp(resizedImage).toFile(uploadPath);
    return { buffer: resizedImage, uploadPath };
  }

  static async cropToAspectRation(buffer, ratio, mimeType) {
    const [width, height] = ratio.split(":");
    const reSizedImage = await sharp(buffer)
      .resize({
        width: width,
        height: Math.round(1080 * (height / width)),
      })
      .extract({
        left: 0,
        top: 0,
        width: 1080,
        height: Math.round(1080 * (height / width)),
      })
      .toBuffer();

    const extension = mimeType.split("/")[1];

    const fileName = `${crypto
      .randomBytes(62)
      .toString("hex")}_${Date.now()}.${extension}`;
    const uploadPath = path.join(
      __dirname,
      "../../../",
      "upload/posts/",
      fileName
    );
    await sharp(reSizedImage).toFile(uploadPath);
    return { buffer: reSizedImage, uploadPath };
  }
}

module.exports = ImageUtility;
