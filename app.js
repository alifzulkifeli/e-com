//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const app = express();



//change static to dyanamic web sysytem using ejs
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
/*----------------------------------------------*/


//start session and cookies
app.use(session({
    secret:"kampong kawe",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// init mongoooooooooooooooooooo
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    ggleId: String,

    username: String,  
    location: String,
    phone_no: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);
/*----------------------------------------------*/


// OAuth use google@fb and pass hash
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
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ ggleId: profile.id , username:profile.displayName}, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.ATAS,
    clientSecret: process.env.BAWAH,
    callbackURL: "http://localhost:3000/auth/facebook/jombeli"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ ggleId: profile.id ,username:profile.displayName}, function (err, user) {
    return cb(err, user);
    });
  }
));
/*----------------------------------------------*/


/*---------------------GET-------------------------*/
app.get("/",function(req,res) {
   
    if (req.isAuthenticated()) {
        const navbar = "navbar_login";
        res.render("home",{navbar:navbar, nama:req.user.username});
        
        
    } else {
        const navbar = "navbar";
        res.render("home",{navbar:navbar});       
    }

});

app.get("/auth/google",
    passport.authenticate("google",{scope:["profile"]})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});



app.get('/auth/facebook',
passport.authenticate('facebook',{ prompt: 'select_account',scope: ['user_friends', 'manage_pages']}));


app.get('/auth/facebook/jombeli',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});


app.get("/login",function(req,res) {
    res.render("login");
});

app.get("/register",function(req,res) {
    res.render("register");
});


/*----------------------------------------------*/


/*---------------------POST-------------------------*/

app.post("/",function (req, res) {  
    const location = req.body.location;
    const phone_no = req.body.phone_no;
    User.findById(req.user.id,function (err, foundUser) {
        if (err) {
            alert("please log in first");
            res.redirect("/");
        }else{
            if (foundUser) {    
                foundUser.phone_no=phone_no;                        
                foundUser.location = location;
                foundUser.save(function () {
                    res.redirect("/");
                });
            }    
        }
    });
    
});




app.get("/logout", function (req, res) {
    req.session.destroy(function(e){
        req.logout();
        res.redirect('/');
    });
})

app.post("/register",function (req,res) {  
    User.register({username:req.body.username , location:req.body.location}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err); 
            res.redirect('/register') 
        }else{
            passport.authenticate("local")(req,res, function () {
                res.redirect("/");
            });
        }     
    });
   
});

app.post("/login", function (req,res) {        
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });
    
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, function () {
            res.redirect("/");
            });
        }
    });

});

/*----------------------------------------------*/


app.listen(3000,function () {
    console.log("server started at port 3000");
})