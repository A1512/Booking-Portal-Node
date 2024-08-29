const express = require("express");
const routes = require("./routes/routes");
const app = express();
const cors = require("cors");
const port = 1000;

// create application/json parser
// var jsonParser = bodyParser.json()
app.use('/uploads', express.static('uploads'));  //this is multer configuration for accept image file. 
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cors());  //these policy work for to accept request from different domains.

app.use("/api/booking", routes); //this configuration for all routes each api request go through this.

// Start the Express Server listen on 1000 port.
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
