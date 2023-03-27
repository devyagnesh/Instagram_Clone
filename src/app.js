const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ErrorHandling = require("./middlewares/ErrorHandling");

const app = express();
const db = require("./config/Db");

/*
    || ++++ Importing Routes ++++ ||
 */

const userRoute = require("./routes/user.routes");
const tokenRoute = require("./routes/token.routes");
const privacyRoute = require("./routes/privacy.routes");

app.use(express.static("upload/profile/"));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(cookieParser());

app.use("/api/user", userRoute);
app.use("/api/auth", tokenRoute);
app.use("/api/privacy", privacyRoute);
/*
    || ++++++ GLOBAL ERROR HANDLING MIDDLEWARE ++++++ ||
*/
app.use(ErrorHandling);

module.exports = app;
