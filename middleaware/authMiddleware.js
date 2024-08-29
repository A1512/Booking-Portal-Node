//this is middleware function use for to authenticate user on api request.
const jwt = require("jsonwebtoken");
require("dotenv");
function tokenVerify(req, res, next) {
  let token;
  if (req.headers["jwt-token-customer"]) {
    token = req.headers["jwt-token-customer"];
  } else if (req.headers["jwt-token-business"]) {
    token = req.headers["jwt-token-business"];
  }
  // console.log("token", token);
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  // console.log("jwt secret key", jwtSecretKey);
  if (token) {
    try {
      const verified = jwt.verify(token, jwtSecretKey);
      if (verified) {
        next();
      } else {
        // Access Denied
        return res.status(401).json({ message: "unauthorised user" });
      }
    } catch (error) {
      // Access Denied
      return res.status(401).json({ message: "token is expire" });
    }
  } else {
    res.status(401).json({ message: "invalid token!!" });
  }
}

module.exports = tokenVerify;
