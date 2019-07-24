const axios = require('axios');
const HTTPS = require('https');
const Person = require('./Person.js');

var botID = process.env.BOT_ID;
  //"6d3432608041f855ed6ac6b388" = Meme Judge
  //"ac9aa940f56910279f8ddd7e8a" = Black Bot

// https://dev.groupme.com/docs/v3 ~ API documentation
const baseUrl = 'https://api.groupme.com/v3/groups/';
const token = 'token=1df9001037c901372aca3263649c7787';
const groupId = '40490400';//'50769460'; //507... = Meme Court, 404... = Black Rose
const msgLimit = '100';
  // GET /groups/:group_id/messages
const url = baseUrl + groupId + '/messages' + '?' + token + '&limit=' + msgLimit;

//use above url to get messages for specific groupchat
getMessages(url)
  .then(messagesJSON => {

    /*output for debugging
    console.log(JSON.stringify(messagesJSON, '', 2));
    */

    var Members = []; //array filled with Person objects (grows dynamically)
    

    Members = getMemberStats(messagesJSON, Members)
    .then(Members => {
      /*
       console.log(Members);
       */
        //output for debugging
       //console.log("The number of members in the chat are: " + Members.length);


      
      //console.log(comparePeople(Members[0], Members[1]));

        /*compares Person Objects
         -1 if p1 has a higher Like-Post-ratio
          0 if IDs are the same or if Like-Post-ratio is same
          1 if p1 has a lower Like-Post-ratio

          IN ORDER BY RANK (1 > 2 > 3, etc.)
        */
      sortedMembers = Members.sort(function(p1,p2) {//arr.sort([compareFunction])
        if (p1.likePostRatio() > p2.likePostRatio()) {
          return -1;
        } else if(p1.likePostRatio() == p2.likePostRatio()) {
          return 0;
        } else {
          return 1;
        }
      });
      /*
      console.log("Sorted Array: ");
      console.log(sortedMembers);
      */

      //first 5 Persons in sortedMembers are highest ranked

      outputString = "Leaderboard: \n";

      for(z = 0; z < 5 && z < sortedMembers.length; z++) { //only want 5, or all if less than five
        outputString += (z + 1) + ". " + sortedMembers[z] + "\n";
      }
        //console.log(outputString);

    })  
    
  })
  .catch(error => {
    console.log(error);
  })




  //gets messagesJSON
function getMessages(URL) {
  const messagePromise = new Promise((resolve, reject) => {
    axios.get(URL)
    .then(function (response) {
      // gets response and prints messages
        
        //messages is in JSON form
      var mJSON = response.data.response.messages;   //function scope on variables

        //for debugging purposes
      //console.log(JSON.stringify(mJSON, '', 2)); 

      //return mJSON; 
      resolve(mJSON);
    })
    .catch(function (error) {
      // handle error
      reject(error);
    })
  })
  //return the promise
  return messagePromise;
}



  //updates the array
function getMemberStats(posts, members) {
  const statsPromise = new Promise((resolve, reject) => {
    //go through JSON and instantiate/increment Person objects
    memberUsage = 0;
    for(i = 0; i < Object.keys(posts).length; i++) {

      currentID = posts[i].user_id; //using ID to define owner of current post
      var currentPersonIndex;
      //sender must be a user and post must be a picture
      if(posts[i].sender_type == 'user' && posts[i].attachments.length > 0) {

        //find if person is already instantiated
        personExists = false;
        for(y = 0; y < memberUsage; y++) {
            if (members[y].ID == currentID) {
                personExists = true;
                currentPersonIndex = y;
                break;
            } //if
        } //for

        if(personExists) { //if person exists

          //increment the person
          members[currentPersonIndex].plusPost(1);
          members[currentPersonIndex].plusLikes(posts[i].favorited_by.length);


        } else {//if not instantiated
        
          members[memberUsage] = new Person(posts[i].name, currentID);

          //increment the Person
          members[memberUsage].plusPost(1);
          members[memberUsage].plusLikes(posts[i].favorited_by.length);

          memberUsage++;

        

        } //if-else
      } //if
    } //for
    resolve(members);  
  })


  return statsPromise;
}

  


  //response functions
function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      //botRegex = /^\/cool guy$/;
      botRegex = /^verdict\?$/i;  // i flag -> case insensitive string

  if(request.text && botRegex.test(request.text)) { //text coming in, Regex (regular expressions)
    this.res.writeHead(200);
    postMessage();
    this.res.end();
  } else if(request.text && (request.text == "/postResults")) {
    this.res.writeHead(200);
    postResults(outputString);
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




function postResults(outputString) { //outputString
  var botResponse, options, body, botReq;

  botResponse = outputString;//Should be in string form

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