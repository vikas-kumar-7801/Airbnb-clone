const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const { error } = require('console');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema }= require('./schema.js');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended:true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const port = 8080;

const MONGO_URL = "mongodb://127.0.0.1:27017/Airbnb";    

main()
    .then((res) =>{
        console.log("Connection to DB");
    })
    .catch(err => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.get("/", (req, res) => {
    res.send("Hi, I am Root");
});

const validateListing = (rq, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map( (el) => el.message ).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

// Index Route
app.get("/listings", wrapAsync( async (req, res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
})
);

// New Route 
app.get("/listings/new", (req, res) => {
    res.render("./listings/new.ejs");
})

//Create Route
app.post("/listings", validateListing,
    wrapAsync( async(req, res, next) => {
        // We use join.dev to handel error for Schema Validation -> schema.js
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

//Show Route
app.get("/listings/:id", wrapAsync( async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("./listings/show.ejs", { listing });
})
);

//Edit Route 
app.get("/listings/:id/edit", wrapAsync( async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("./listings/edit.ejs", { listing })
})
);

//Update Route 
app.put("/listings/:id", validateListing, wrapAsync( async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`)
})
);

// Delete Route
app.delete("/listings/:id", wrapAsync( async (req, res) => {
    let { id } = req.params;
    let deleteListings= await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
    console.log(deleteListings);
})
);

app.use("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode=500, message= "Something Went Wrong!" } = err;
    // res.status(statusCode);
    // res.render("error.ejs", { message });
    res.status(statusCode).render("error.ejs", { err });
});

app.listen(port, () => {
    console.log(`App is listening to ${port}`);
});