var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mongooseScraper"

// , { useNewUrlParser: true });

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


app.get("/scrape", function (req, res) {
  axios.get("http://www.foxnews.com/").then(function (response) {
    var $ = cheerio.load(response.data);

    $("h2.title").each(function (i, element) {
      // Save an empty result object
      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      db.Article.create(result)
        .then(function (dbArticle) {
          console.log(dbArticle);
        })
        .catch(function (err) {
          return res.json(err);
        });
    });

    res.send("Scrape Complete, click <a href='/' <p> here</a> to go home and see what we scraped </p>");
  });
});

app.get("/articles", function (req, res) {
  db.Article.find({saved: {$ne: true}})
    .then(function (data) {
      res.json(data);
    })
});

app.get("/articles/saved", function (req, res) {
  db.Article.find({saved: {$ne: false}})
    .then(function (data) {
      res.json(data);
    })
});

app.get("/articles/:id", function (req, res) {
  db.Article.findOne({
    _id: req.params.id
  }).then(function (data) {
    res.json(data);
  })

});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "home.html"));
});

app.get("/saved", function (req, res) {
  res.sendFile(path.join(__dirname, "saved.html"));
});


app.put("/articles/:id", function (req, res) {
  db.Article.findByIdAndUpdate(req.params.id, { saved: true }, { new: true })
    .then(function (dbMovie) {
      res.json(dbMovie);
    }).catch(function (err) {
      res.status(400).send(err);
    });
});

app.put("/articles/unsave/:id", function (req, res) {
  db.Article.findByIdAndUpdate(req.params.id, { saved: false }, { new: true })
    .then(function (dbMovie) {
      res.json(dbMovie);
    }).catch(function (err) {
      res.status(400).send(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});