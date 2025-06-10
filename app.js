if (process.env.NODE_ENV != "production") {
    require('dotenv').config()
    
}


const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");




// routers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to DB");
})
    .catch((err) => {
        console.log(err);
    })
async function main() {
    await mongoose.connect(dbUrl);
}


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, ("public"))))

const store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter : 24 * 3600,
});

store.on("error", ()=>{
    console.log("Error in MONGO SESSION STORE ", err);
})
const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    }
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

// app.get("/", (req, res) => {
//     res.send("Hi, I am root");
// })

// app.get("/demouser",async (req,res)=>{
//     let fackUser = new User({
//         email:"amar@gmail.com",
//         username : "delta-user"
//     });

//    let newUser = await User.register(fackUser, "helloworld");
//     console.log(newUser);
//     res.send(newUser);

// })

// Root route → redirect to listings
app.get("/", (req, res) => {
    res.redirect("/listings");
});
// lisitngs route
app.use("/",listingRouter);
// Reviews routes access
app.use("/listings/:id/reviews", reviewRouter );
// User routes
app.use("/", userRouter);

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not Found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
    // res.status(statusCode).send(message);
});


app.listen(8080, () => {
    console.log("server is listening to port on 8080");
})



// app.get("/listing", async (req, res) => {
//     let listing = new Listing({
//         title: "My City",
//         description: "this is a big city ",
//         price: 25000,
//         location: "Jalandher, Bus stand Jalandher",
//         country: "India",

//     })
//     await listing.save();

//     console.log("sample was saved");
//     res.send("successfully listing...");
// })
