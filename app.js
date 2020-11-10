//jshint esversion:6

////////////////////////////////// BOILER PLATE CODE ///////////////////////////////////////
//required packages
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(passport.initialize());
app.use(passport.session());

////////////////////////////////// DATABASE ///////////////////////////////////////

mongoose.connect("mongodb+srv://"+ process.env.DATABASE_NAME + ":" + process.env.DATABASE_PASSWORD + "@cluster0.yj0o0.mongodb.net/Secret",
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  username: {
    type: String,
    required: false,
    unique: false
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

////////////////////////////////// AUTHENITCATION ///////////////////////////////////////



////////////////////////////////// HOME PAGE ///////////////////////////////////////

app.get("/", function(req, res) {
  res.render("home");
});


////////////////////////////////// LOGIN ///////////////////////////////////////

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req,res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  user.save();
  res.redirect("/secrets");

});

////////////////////////////////// REGISTER ///////////////////////////////////////



////////////////////////////////// SECRETS PAGE ///////////////////////////////////////

app.get("/secrets", function(req,res) {
  User.find({"secret": {$ne:null}}, function(err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});


////////////////////////////////// LOGOUT ///////////////////////////////////////

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

////////////////////////////////// SERVER ///////////////////////////////////////

let port = process.env.PORT;
if (port == null || port == "")
  port = 3000;

app.listen(port, function() {
  console.log("Server started...");
});
