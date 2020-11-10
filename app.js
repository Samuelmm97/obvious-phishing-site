//jshint esversion:6

////////////////////////////////// BOILER PLATE CODE ///////////////////////////////////////
//required packages
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: 'super duper secret',
  resave: false,
  saveUninitialized: true,
}));

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
  googleId: {
    type: String,
    required: false,
    unique: false
  },
  secret: String,
  facebookId: {
    type: String,
    required: false,
    unique: false
  },
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

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_APP_CALLBACK,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_APP_CALLBACK
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));




////////////////////////////////// HOME PAGE ///////////////////////////////////////

app.get("/", function(req, res) {
  res.render("home");
});

////////////////////////////////// GOOGLE USERS ///////////////////////////////////////

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate("facebook", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


////////////////////////////////// LOGIN ///////////////////////////////////////

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req,res) {

  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});

////////////////////////////////// REGISTER ///////////////////////////////////////

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req,res) {

  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});

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

////////////////////////////////// SUBMIT PAGE ///////////////////////////////////////

app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;

  console.log(req.user);

  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function() {
          res.redirect("/secrets");
        });
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
