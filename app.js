//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.set("view engine","ejs");

app.use(session({
    secret:"thisisasecretforthelvl5",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://shubham:Shubham%4019@cluster0.gdayu.mongodb.net/secretsDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets",
//     userProfileURL:"https://www.googlepis.com/oauth2/v3/userinfo",
//     passReqToCallback: true
//   },
//   function(request, accessToken, refreshToken, profile, done) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return done(err, user);
//     });
//   }
// ));

app.get("/",function(req,res){
    res.render("home")
});
app.get("/login",function(req,res){
    res.render("login")
});
app.get("/register",function(req,res){
    res.render("register")
});

app.get("/logout",function(req,res){
    req.logOut();
    res.redirect("/");
});

app.get("/secrets",function(req,res){
    User.find({secret:{$ne:null}},function(err,foundUsers){
        if(err){
            res.redirect("/login");
        }else{
            if(foundUsers){
            res.render("secrets",{allSecrets:foundUsers});
            }
        }
    });
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit",function(req,res){
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = req.body.secret;
                foundUser.save();
                res.redirect("/secrets");
            }
        }
    });
});


// app.get("/auth/google",
//   passport.authenticate("google", { scope:["profile"] }
// ));

// app.get("/auth/google/secrets",
//     passport.authenticate("google",{failureRedirect:"/login",successRedirect:"/secrets"}
// ));

app.post("/register",function(req,res){
    User.register({username:req.body.username}, req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
});

app.post("/login",function(req,res){
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });

    req.login(newUser,function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }else{
            passport.authenticate("local")(req,res,function(err){
                if(!err){
                    res.redirect("/secrets");
                }else{
                    res.redirect("/");
                }
            });
        }
    });
});

app.get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/");
});

app.listen(3000,function(){
    console.log("port started at 3000");
});