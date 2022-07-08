require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

//Routes
// app.use("/", (req, res) => {
//   res.json({ msg: "hello" });
// });
app.use("/api", require("./routes/authRouter"));

const URI = process.env.MONGO_URL;
mongoose.connect(URI, (err) => {
  if (err) throw err;
  console.log("connected to mongodb");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log("Server is listening to port ", PORT);
});
