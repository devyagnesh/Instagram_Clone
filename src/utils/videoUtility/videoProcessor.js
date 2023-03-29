const ffmpeg = require("@ffmpeg-installer/ffmpeg");
const ffprobe = require("@ffprobe-installer/ffprobe");
const ffmpegs = require("fluent-ffmpeg");
class VideoProcess {
  static async getVideoInformation(path) {
    const ffmpegPath = ffmpeg.path;
    const ffprobePath = ffprobe.path;

    ffmpegs.setFfmpegPath(ffmpegPath);
    ffmpegs.setFfprobePath(ffprobePath);

    return new Promise((resolve, reject) => {
      ffmpegs.ffprobe(path, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          console.log("METADATA : ", metadata);
          const { duration, size, width, height } = metadata.streams[0];
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            width: width,
            height: height,
          });
        }
      });
    });
  }
}

module.exports = VideoProcess;
