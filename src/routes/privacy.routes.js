const express = require("express");
const Authentication = require("../middlewares/Authentication");

const route = express.Router();
const { MakeAccountPrivate } = require("../controllers/privacy.controller");
route.post("/private", Authentication, MakeAccountPrivate);

module.exports = route;
