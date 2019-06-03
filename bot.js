var HTTPS = require('https');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;

function respond() {//* */
  var request = JSON.parse(this.req.chunks[0]),
      //botRegex = /^\/cool guy$/;
      botRegex = /^[vV]erdict\?$/;

  if(request.text && botRegex.test(request.text)) { //text coming in, Regex (regular expressions)
    this.res.writeHead(200);
    postMessage();
    this.res.end();
  }
  else if(request.text && (request.text == "hi")) {   //if you say hi in chat
    this.res.writeHead(200);
    postMessage2();
    this.res.end();
  } 
  else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function postMessage() {
  var botResponse, options, body, botReq;

  //botResponse = cool();
  botResponse = "Guilty!"; //Should be in string form

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };


  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}



function postMessage2() {
  var botResponse, options, body, botReq;

  botResponse = "whats good";

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };


  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
    if(res.statusCode == 202) {
      //neat
    } else {
      console.log('rejecting bad status code ' + res.statusCode);
    }
});

botReq.on('error', function(err) {
  console.log('error posting message '  + JSON.stringify(err));
});
botReq.on('timeout', function(err) {
  console.log('timeout posting message '  + JSON.stringify(err));
});
botReq.end(JSON.stringify(body));

}
exports.respond = respond;