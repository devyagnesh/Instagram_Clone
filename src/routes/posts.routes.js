const express = require("express");
const route = express.Router();
const Authentication = require("../middlewares/Authentication");
const { CreatePost, upload } = require("../controllers/posts.controller");

route.post("/post", Authentication, upload, CreatePost);

module.exports = route;
