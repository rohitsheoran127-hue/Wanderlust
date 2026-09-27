const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    let { search, category } = req.query;
    let filter = {};
    // Category filter
    if (category) {
        filter.category = category;
    }

    // Search filter
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { country: { $regex: search, $options: "i" } }
        ];
    }
    let allListings = await Listing.find(filter);
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    // console.log(listing);
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    })
        .send();
    let listingData = req.body.listing;

    const newListing = new Listing(listingData);

    newListing.image = {
        filename: req.file.filename,
        url: req.file.path

    };

    newListing.owner = req.user._id;
    newListing.geometry = response.body.features[0].geometry;

     await newListing.save();
    // console.log(savedListing);

    req.flash("success", "New listing created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let { title, description, price, country, location, category } = req.body.listing;

    const geoData = await geocodingClient
        .forwardGeocode({
            query: location,
            limit: 1
        })
        .send();

    let coordinates = geoData.body.features[0].geometry.coordinates;

    let updateData = {
        title,
        description,
        price,
        country,
        location,
        category,

        geometry: {
            type: "Point",
            coordinates: coordinates
        }
    };

    if (req.file) {
        updateData.image = {
            filename: req.file.filename,
            url: req.file.path
        };
    }

    await Listing.findByIdAndUpdate(
        id,
        updateData,
        {
            runValidators: true
        }
    );

    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
};
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await (Listing.findByIdAndDelete(id));
    // console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};