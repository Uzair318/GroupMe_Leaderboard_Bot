const axios = require('axios');
const HTTPS = require('https');
const Person = require('./Person.js');
const mongoose = require('mongoose');
const Mongo = require('./Mongo');
const dotenv = require('dotenv').config();

//CURRENT STATE: Meme Court (TESTING)

postHighest();

/*
 *  TO CHANGE BOT TO NEW GROUPCHAT
 *    1. Switch groupId
 *    2. Switch BOT_ID in .env
 *    3. Switch BOT_ID config var on Heroku (https://dashboard.heroku.com/apps/meme-chat-bot)
 *    (be sure to double check callback URL of each bot on GroupMe site)
 */

// f857f36c11d25f33c6c2980505 = Meme Chat (PRODUCTION)
// 4bb46a8ba8d21f56cd430d05a4 = Meme Court *


var mongo = new Mongo();

var botID = process.env.BOT_ID;

//"f857f36c11d25f33c6c2980505" = Meme Chat


// https://dev.groupme.com/docs/v3 ~ API documentation
const baseUrl = 'https://api.groupme.com/v3/groups/';
const token = 'token=1df9001037c901372aca3263649c7787';
const groupId = '50769460';// '26930811' = Meme Chat, '50769460' = Meme Court
const msgLimit = '100';
// GET /groups/:group_id/messages
const url = baseUrl + groupId + '/messages' + '?' + token + '&limit=' + msgLimit;


function createOutput() {
  return new Promise((resolve, reject) => {
    getMessages(url)
      .then(messagesJSON => {
        /*output for debugging
        console.log("Number of messages recieved: " + messagesJSON.length);
        console.log(JSON.stringify(messagesJSON, '', 2));
        */

        var Members = []; //array filled with Person objects (grows dynamically)

        Members = getMemberStats(messagesJSON, Members)
          .then(Members => {
            /*
             console.log("Members: \n" + Members);
             */
            //output for debugging
            //console.log("The number of meme-posting members in the chat are: " + Members.length);



            //console.log(comparePeople(Members[0], Members[1]));

            /*compares Person Objects
             -1 if p1 has a higher Like-Post-ratio
              0 if IDs are the same or if Like-Post-ratio is same
              1 if p1 has a lower Like-Post-ratio
    
              IN ORDER BY RANK (1 > 2 > 3, etc.)
            */
            sortedMembers = Members.sort(function (p1, p2) {//arr.sort([compareFunction])
              if (p1.likePostRatio() > p2.likePostRatio()) {
                return -1;
              } else if (p1.likePostRatio() == p2.likePostRatio()) {
                return 0;
              } else {
                return 1;
              }
            });
            /* 
            console.log("Sorted Array: \n");
            console.log(sortedMembers);
            */

            //first 5 Persons in sortedMembers are highest ranked

            outputString = "Leaderboard: \n"; //ADD NAME OF GROUPCHAT!!!

            for (z = 0; z < 5 && z < sortedMembers.length; z++) { //only want 5, or all if less than five
              outputString += (z + 1) + ". " + sortedMembers[z] + "\n";
            }
            /*
            //Displays date and time of call to see if string actually updates
              outputString += " " + Date.now();
            
              console.log(outputString);
            */
            resolve(outputString);

          })

      })
      .catch(error => {
        console.log(error);
      })
  })
}
//use above url to get messages for specific groupchat




//gets messagesJSON
function getMessages(URL) {
  return new Promise((resolve, reject) => {
    axios.get(URL)
      .then(function (response) {
        // gets response and prints messages

        //messages is in JSON form
        var mJSON = response.data.response.messages;   //function scope on variables
        //for debugging purposes
        /*
        console.log(JSON.stringify(mJSON, '', 2)); 
        console.log("Number of Messages: " + mJSON.length);
         */
        //return mJSON; 
        resolve(mJSON);
      })
      .catch(function (error) {
        // handle error
        reject(error);
      })
  })
}



//updates the array
function getMemberStats(posts, members) {
  return new Promise((resolve, reject) => {
    //go through JSON and instantiate/increment Person objects

    //number of likes on the highest post
    mongo.getNumLikes()
      .then(currentHighestLikes => {
        memberUsage = 0;
        for (i = 0; i < Object.keys(posts).length; i++) {

          currentID = posts[i].user_id; //using ID to define owner of current post
          var currentPersonIndex;
          //sender must be a user and post must be a picture
          if (posts[i].sender_type == 'user' && posts[i].attachments.length > 0) {

            //if has higher number of likes than currentHighest
            if (posts[i].favorited_by.length > currentHighestLikes) {
              Mongo.updateHighest(posts[i]); //add parameters
            }

            //find if person is already instantiated
            personExists = false;
            for (y = 0; y < memberUsage; y++) {
              if (members[y].ID == currentID) {
                personExists = true;
                currentPersonIndex = y;
                break;
              } //if
            } //for

            if (personExists) { //if person exists

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
  });


}




//response functions
function respond() {
  var request = JSON.parse(this.req.chunks[0]),
    botRegex = /^verdict\?$/i;  // i flag -> case insensitive string

  var senderID = request.sender_id;

  mongo.incrementCount()
    .then((countPlus) => {
      //countPlus = 100; //FOR TESTING PURPOSES, REMOVE BEFORE DEPLOYING
      console.log("Number of messages since last post: " + countPlus);
      if (countPlus == 80 || (request.text && (request.text == "/postResults"))) {
        this.res.writeHead(200);
        postResults(senderID);
        this.res.end();
      } else if ((request.text && (request.text == "/postHighest"))) {
        this.res.writeHead(200);
        postHighest();
        this.res.end();
      } else if (request.text && botRegex.test(request.text)) { //text coming in, Regex (regular expressions)
        this.res.writeHead(200);
        postMessage();
        this.res.end();
      } else {
        console.log("don't care");
        this.res.writeHead(200);
        this.res.end();
      }
    });
}



function postMessage() {
  var botResponse, options, body, botReq;

  botResponse = "Guilty!"; //Should be in string form

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id": botID,
    "text": botResponse
  };


  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function (res) {
    if (res.statusCode == 202) {
      //neat
    } else {
      console.log('rejecting bad status code ' + res.statusCode);
    }
  });

  botReq.on('error', function (err) {
    console.log('error posting message ' + JSON.stringify(err));
  });
  botReq.on('timeout', function (err) {
    console.log('timeout posting message ' + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}




function postResults(senderID) {

  var botResponse, options, body, botReq;
  const Admins = ['18197056', '39735084', '30109965', '46367350', '46537569'];  //array filled with user_id's of members that are allowed to display scoreboard
  //             [ Izu       ,  Uzair   ,  Dan      ,  Ahmad    ,  Mohamed Yusuf]

  if (Admins.includes(senderID)) {
    responseString = createOutput()
      .then(responseString => {
        botResponse = responseString; //Should be in string form

        options = {
          hostname: 'api.groupme.com',
          path: '/v3/bots/post',
          method: 'POST'
        };

        body = {
          "bot_id": botID,
          "text": botResponse
        };


        console.log('sending ' + botResponse + ' to ' + botID);

        botReq = HTTPS.request(options, function (res) {
          if (res.statusCode == 202) {
            //neat
          } else {
            console.log('rejecting bad status code ' + res.statusCode);
          }
        });

        botReq.on('error', function (err) {
          console.log('error posting message ' + JSON.stringify(err));
        });
        botReq.on('timeout', function (err) {
          console.log('timeout posting message ' + JSON.stringify(err));
        });
        botReq.end(JSON.stringify(body));
      }
      )
  }
  else { //not allowed
    botResponse = "Sorry, you do not have permission to do this.";//; + "\n senderID: " + senderID; //Should be in string form

    options = {
      hostname: 'api.groupme.com',
      path: '/v3/bots/post',
      method: 'POST'
    };

    body = {
      "bot_id": botID,
      "text": botResponse
    };


    console.log('sending ' + botResponse + ' to ' + botID);

    botReq = HTTPS.request(options, function (res) {
      if (res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
    });

    botReq.on('error', function (err) {
      console.log('error posting message ' + JSON.stringify(err));
    });
    botReq.on('timeout', function (err) {
      console.log('timeout posting message ' + JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
  }
}


function postHighest() {
  var botResponse, options, body, botReq;
  mongo = new Mongo();
  /*
    var imgURL = mongo.getURL();
    var bestOwner = mongo.getOwner();
    var postText = mongo.getText(); //returns false if no text
  */
  //Promise.all([imgURL, bestOwner, postText]).then(function (values) {
  //console.log(values);
  /*
  imgURL = values[0];
  bestOwner = values[1];
  postText = values[2];
  
  botResponse = "Highest Ranking Post of All Time: \n"; //Should be in string form
  botResponse += "\t by: " + bestOwner + "\n";
  if (postText != "") {
    botResponse += "\n" + "\t" + "\"" + postText + "\"";
  } */
  mongo.highestToString()
    .then(botResponse, imgURL => {
      console.log("botResponse: " + botResponse);
      console.log("imgURL: " + imgURL);
      options = {
        hostname: 'api.groupme.com',
        path: '/v3/bots/post',
        method: 'POST'
      };

      body = {
        "bot_id": botID,
        "text": botResponse,
        "attachments": [
          {
            "type": "image",
            "url": imgURL
          }
        ]
      };


      console.log('sending ' + botResponse + ' to ' + botID);

      botReq = HTTPS.request(options, function (res) {
        if (res.statusCode == 202) {
          //neat
        } else {
          console.log('rejecting bad status code ' + res.statusCode);
        }
      });

      botReq.on('error', function (err) {
        console.log('error posting message ' + JSON.stringify(err));
      });
      botReq.on('timeout', function (err) {
        console.log('timeout posting message ' + JSON.stringify(err));
      });
      botReq.end(JSON.stringify(body));


    });

}





exports.respond = respond; 