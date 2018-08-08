var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/mongooseScraper", { useNewUrlParser: true });


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

    res.send("Scrape Complete");
  });
});

app.get("/articles", function (req, res) {
  db.Article.find()
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

app.post("/articles/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {

      return db.Article.findByIdAndUpdate(req.params.id, {
        $set: {
          note: dbNote._id
        }
      }, {
          new: true
        });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err)
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});