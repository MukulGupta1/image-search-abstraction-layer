//https://www.googleapis.com/customsearch/v1?q=car&cx=012217375386242453795%3A30e6_-vbzvc&key={YOUR_API_KEY}

var express = require('express');
var https = require('https');
var mongo = require('mongodb');
var app = express();
var offset = 1;
var collection;

var port = process.env.PORT || 8080;

var SEARCH_ENGINE_ID = '012217375386242453795%3A30e6_-vbzvc'
var API_KEY = 'AIzaSyARLHK_qJqbiAIrY4lD1zaQTrGH93SpiGI'
var BASE_URL = 'https://www.googleapis.com/customsearch/v1'
var url = process.env.MONGODB_URI
console.log('url: ' + url);

mongo.connect(url, function(err,dbase){
  if (err) return console.log(err);
  db = dbase;
  collection = db.collection('search');
  app.listen(port, function () {
    console.log('Listening on port: ' + port);
  });
})

app.get('/api/imagesearch/:id', function(req, res){
  var path = req.params.id;
  var currentdate = new Date();
  var searchObj = {};
  searchObj.term = path;
  searchObj.when = currentdate;

  //insert into database
  collection.insert(searchObj, function(err,data){
    if (err) throw err;
    console.log('Search logged inside database')
  });

  if(req.query.offset){
    offset = req.query.offset;
    offset = offset * 10 + 1;
  };
  var finalResponse = {};
  var url = BASE_URL + '?q=' + req.params.id + '&cx='+ SEARCH_ENGINE_ID + '&key=' + API_KEY + '&start=' + offset;
  var request = https.get(url, function (response) {
    var buffer = "",
        data,
        items;
    var image = {};
    var images = [];
    response.on("data", function (chunk) {
        buffer += chunk;
    });
    response.on("end", function (err) {
        data = JSON.parse(buffer);
        items = data.items;
        for (var i = 0; i < items.length; i++){
          image = {};
          if(items[i].pagemap.cse_image && items[i].pagemap.cse_thumbnail){
            image.url = items[i].pagemap.cse_image[0].src;
            image.snippet = items[i].snippet;
            image.thumbnail = items[i].pagemap.cse_thumbnail[0].src;
            image.context = items[i].formattedUrl;
            images.push(image);
          }
        }
        res.end(JSON.stringify(images));
    });
  });
});

app.get('/api/latest/imagesearch/', function(req,res){
  collection.find().toArray(function(err,documents){
    if(err) throw err;
    res.end(JSON.stringify(documents));
  });
});
