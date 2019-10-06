
/******************************************************************************************
 * GroupMe Chat Bot callback server
 */

var http, axios, director, bot, router, server, port;

http        = require('http');
axios       = require('axios');
director    = require('director');
bot         = require('./bot.js');

router = new director.http.Router({
  '/' : {
    post: bot.respond,
    get: ping
  }
});

server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });

  router.dispatch(req, res, function(err) {
    res.writeHead(err.status, {"Content-Type": "text/plain"});
    res.end(err.message);
  });
});

port = Number(process.env.PORT || 5000);
server.listen(port);
console.log("Server started on port: " + port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Order in the court!");
}


/****************************************************************************************
 * EXPRESS APP
 * @author Uzair Ahmed
 * 
 * Provides endpoint for frontend to get data from MongoDB
 */


var express = require('express');
var mongoose = require('mongoose');
const Mongo = require('./Mongo')
require('dotenv/config');

const app = express();
var mongo = new Mongo();
/**
 * Requirements of express server
 * 1. Respond to frontend request for updated scores array
 * 2. Set update flag in mongoDB (how to communicate to frontend to update?)
 */


// connect to MongoDB using mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, () =>
  console.log('succcessfully connected to MongoDB')
)


// get request from frontend -> return scoresArray from MongoDB
app.get('/scores', (req, res) => {

  mongo.getScores()
    .then(scoresArray => {
      res.send(scoresArray)
      //res.json(scoreArray);
      console.log('sent Scores Array!');
    })
    .catch(err => {
      console.log(err);
    })

})


// start listening to the server...
app.listen(process.env.PORT || 3000)
console.log('listening on port 3000')