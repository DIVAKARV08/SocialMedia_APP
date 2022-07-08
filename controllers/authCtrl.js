const users = require("../models/useModels");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authCtrl = {
  register: async (req, res) => {
    try {
      const { fullname, username, email, password, gender } = req.body;
      let newUserName = username.toLowerCase().replace(/ /g, "");

      const user_name = await users.findOne({ username: newUserName });
      if (user_name)
        return res.status(400).json({ msg: "This user name already Exists" });
      const user_email = await users.findOne({ email });
      if (user_email)
        return res.status(400).json({ msg: "This mail id already Exists" });
      if (password.length < 6)
        return res
          .status(400)
          .json({ msg: "Password must be atleast 6 characters" });

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = new users({
        fullname,
        username: newUserName,
        email,
        password: passwordHash,
        gender,
      });

      const access_token = createAccessToken({ id: newUser._id });
      const refresh_token = createRefreshToken({ id: newUser._id });

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/refresh_token",
        maxAge: 30 * 7 * 24 * 60 * 60 * 1000,
      });

      await newUser.save();
      res.json({
        msg: "Registered",
        access_token,
        user: {
          ...newUser._doc,
          password: "",
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await users
        .findOne({ email })
        .populate("followers following", "-password");
      if (!user)
        return res.status(400).json({ msg: "This mail id does not exist" });
      const ismatch = await bcrypt.compare(password, user.password);
      if (!ismatch)
        return res.status(400).json({ msg: "Password does not match" });
      const access_token = createAccessToken({ id: user._id });
      const refresh_token = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/refresh_token",
        maxAge: 30 * 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        msg: "Login Successfully!",
        access_token,
        user: {
          ...user._doc,
          password: "",
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/api/refresh_token" });
      return res.json({ msg: "Logged Out!" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  generateAccesToken: async (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token) return res.status(400).json({ msg: "please Login now" });
      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRETE,
        async (err, result) => {
          if (err) return res.status(400).json({ msg: "please Login now" });
          const user = await users
            .findById(result.id)
            .select("-password")
            .populate("followers following", "-password");
          if (!user)
            return res.status(400).json({ msg: "This user does not exist" });
          const accesstoken = createAccessToken({ id: result.id });
          res.json({ accesstoken, user });
        }
      );
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};
const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRETE, {
    expiresIn: "1d",
  });
};
const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRETE, {
    expiresIn: "30d",
  });
};
module.exports = authCtrl;
