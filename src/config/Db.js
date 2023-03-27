const mongoose = require("mongoose");
const retryInterval = 3000;

const Connect = function () {
  const CONNECTION_URL = process.env.DB_URL;
  mongoose
    .connect(CONNECTION_URL, { autoIndex: true })
    .then(() =>
      console.log("\n +++ Connection to database is successfull +++ \n")
    )
    .catch((error) => {
      console.log("\n --- Connection to database is unSuccessfull --- \n");

      /*
          if somehow connection to databse lost it will retry to connect to mongo databse every 3 second
        */
      // setTimeout(Connect,retryInterval);
    });
};

Connect();

module.exports = mongoose.connection;
