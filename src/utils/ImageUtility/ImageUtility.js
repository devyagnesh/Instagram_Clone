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
}

module.exports = ImageUtility;
