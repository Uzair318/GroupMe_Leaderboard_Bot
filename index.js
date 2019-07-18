var http, axios, director, cool, bot, router, server, port;

http        = require('http');
axios       = require('axios');
director    = require('director');
cool        = require('cool-ascii-faces');
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