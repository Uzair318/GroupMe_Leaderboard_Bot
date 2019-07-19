const axios = require('axios');
var HTTPS = require('https');


var botID = process.env.BOT_ID;

// https://dev.groupme.com/docs/v3 ~ API documentation
const baseUrl = 'https://api.groupme.com/v3/groups/';
const token = 'token=1df9001037c901372aca3263649c7787';
const groupId = '50769460';
const msgLimit = '100';

// GET /groups/:group_id/messages
const url = baseUrl + groupId + '/messages' + '?' + token + '&limit=' + msgLimit;
var messages;

// same thing as curl
axios.get(url)
  .then(function (response) {
    // gets response and prints messages
    
    //messages is in JSON form
    messages = response.data.response.messages;   //function scope on variables

    //for debugging purposes
    //console.log(JSON.stringify(messages, '', 2)); 

  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })

  //arrays grow dynamically, no need to instantiate length
  var posts = JSON.parse(JSON.stringify(messages));
  var Members = []; //array filled with Person objects

  //output for debugging
  console.log("The number of members in the chat are: " + posts.length);



//go through JSON and instantiate/increment Person objects
  memberUsage = 0;
  for(i = 0; i < posts.length; i++) {
    currentID = posts[i].ID;
    //if this person has not been instantiated yet
    if(!Members.includes(posts[i].ID)) {
      Members[memberUsage] = new Person(posts[i].name, posts[i].ID);

      //increment the Person
      Members[memberUsage].plusPost(1);
      Members[memberUSage].plusLikes(posts[i].favorited_by.length);

      memberUsage++;

    } else { //increment the person

      //find the Person object corresponding with this post
      for(j = 0; j < Members.length; j++) {
        if(Members[j].ID == currentID) {
          //increment the person
          Members[j].plusPost(1);
          Members[j].plusLikes(posts[i].favorited_by.length);
          break;
        } //if
      } //for

    } //if-else
  } //for

  for(k = 0; k < Members.length; k++) {
    console.log(Members[k]);
  }

  //updates the array
  function getStats() {

  }














function respond() {//* */
  var request = JSON.parse(this.req.chunks[0]),
      //botRegex = /^\/cool guy$/;
      botRegex = /^verdict\?$/i;  // i flag -> case insensitive string

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