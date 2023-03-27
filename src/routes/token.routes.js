const express = require("express");

const route = express.Router();
const { GetAccessToken } = require("../controllers/token.controller");
route.post("/getToken", GetAccessToken);

module.exports = route;
