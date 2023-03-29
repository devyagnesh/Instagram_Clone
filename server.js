require("dotenv").config({});
const http = require("http");
const socket = require("socket.io");

const app = require("./src/app");

const PORT = process.env.LISTEN_PORT || 5000;
const server = http.createServer(app);
const io = socket(server);

global.Io = io;

server.listen(PORT, function () {
  console.log(
    "\x1b[35m",
    `\n ++++++++ SERVER IS UP ON PORT : ${PORT} ++++++++\n `
  );
});
