const axios = require('axios');
const HTTPS = require('https');
const Person = require('./Person.js');
const mongoose = require('mongoose');
const Mongo = require('./Mongo');
const dotenv = require('dotenv').config();

//CURRENT STATE: Meme Court (TESTING)


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

/**
 * Code for testing
 *  remove before deployment
 */
// updateDBScores()
//   .then(DBScoresArray => {
//     createDBOutput(DBScoresArray)
//       .then(outputString => {
//         console.log(outputString);
//       })
//   })
// mongo.highestToString()

//response functions
function respond() {
  var request = JSON.parse(this.req.chunks[0]),
    botRegex = /^verdict\?$/i;  // i flag -> case insensitive string

  var senderID = request.sender_id;

  mongo.incrementCount()
    .then((countPlus) => {
      console.log("Number of messages since last post: " + countPlus);
      if (countPlus == 50 || (request.text && (request.text == "/postResults"))) {

        /**
         * Every 50 messages:
         *  1. Get last 100 messages
         *  2. Iterate through first 50 and get array of person objects {userID, name, score}
         *  3. Get scores array from MongoDB
         *  4. Increment scores using scores from person array
         *  5. Push new array to MongoDB
         *  6. Post Leaderboard to chat
         */

        this.res.writeHead(200);
        //postResults(senderID);
        //update the scores -> display
        updateDBScores()
          .then(DBScoresArray => {
            postDBResults(senderID, DBScoresArray)
          })
        this.res.end();
      } else if ((request.text && (request.text == "/postHighest"))) {
        this.res.writeHead(200);
        postHighest(senderID);
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

/**
 * Creates output String for leaderboard
 * Uses last 100 messages
 */
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

/**
 * Creates output String for leaderboard
 * Uses DBScoresArray that was just pushed to MongoDB after update
 */
function createDBOutput(DBScoresArray) {
  return new Promise((resolve, reject) => {
    // mongo.getScores()
    //   .then(DBScoresArray => {

    /*compares Person Objects
         -1 if p1 has a higher Like-Post-ratio
          0 if IDs are the same or if Like-Post-ratio is same
          1 if p1 has a lower Like-Post-ratio
 
          IN ORDER BY RANK (1 > 2 > 3, etc.)
    */
    console.log(DBScoresArray)
    sortedScores = DBScoresArray.sort(function (p1, p2) {//arr.sort([compareFunction])
      let LP1 = (p1._numLikes / p1._numPosts)
      let LP2 = (p2._numLikes / p2._numPosts)
      if (LP1 > LP2) {
        return -1;
      } else if (LP1 == LP2) {
        return 0;
      } else {
        return 1;
      }
    });

    //first 5 Persons in sortedScores are highest ranked

    outputString = "LEADERBOARD: \n";

    for (z = 0; z < 5 && z < sortedScores.length; z++) { //only want 5, or all if less than five
      var ratioString = ("LPR: " + (sortedScores[z]._numLikes / sortedScores[z]._numPosts).toFixed(2)).padStart(12, '.');
      outputString += (z + 1) + ". " + (sortedScores[z]._name.substring(0, 20)).padEnd(21, '.') + ratioString + "\n";
    }

    resolve(outputString);
  })
  //})
}



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
        for (i = 0; i < (Object.keys(posts).length / 2); i++) { //evaluates first 50 posts of the 100

          currentID = posts[i].user_id; //using ID to define owner of current post
          var currentPersonIndex;
          //sender must be a user and post must be a picture
          if (posts[i].sender_type == 'user' && posts[i].attachments.length > 0) {

            //if has higher number of likes than currentHighest
            if (posts[i].favorited_by.length > currentHighestLikes) {
              mongo.updateHighest(posts[i]); //add parameters
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

              numberLikes = posts[i].favorited_by.length;

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

/**
 * updates running score in DB
 * calls the modified getMessageStats
 * gets the mongoDB array
 * updates based on new scores array form getMessageStats
 */
function updateDBScores() {
  return new Promise((resolve, reject) => {
    mongo.getScores()
      .then(DBScoreArray => {
        getMessages(url)
          .then(messagesJSON => {
            /*output for debugging
            console.log("Number of messages recieved: " + messagesJSON.length);
            console.log(JSON.stringify(messagesJSON, '', 2));
            */

            var Members = []; //array filled with Person objects from chat message data

            Members = getMemberStats(messagesJSON, Members)
              .then(Members => {
                // console.log("DBScoreArray: ");
                // console.log(DBScoreArray);

                // console.log("Members Array: ")
                // console.log(Members)

                //push Persons onto DBScoreArray
                for (let i = 0; i < Members.length; i++) {
                  let currentPerson = Members[i];
                  // console.log("currentPerson")
                  // console.log(currentPerson);
                  //check if userID exists within DBScoreArray
                  personIfExists(DBScoreArray, currentPerson)
                    .then(person => {
                      // console.log("person if exists")
                      // console.log(person)
                      if (person != undefined) { //if person is in DB increment their scores
                        let scoreIndex = DBScoreArray.indexOf(person)
                        // console.log("scoreIndex")
                        // console.log(scoreIndex)
                        // console.log("incrementing person: ")
                        // console.log(DBScoreArray[scoreIndex]);
                        // console.log("USING DATA FROM PERSON:" + currentPerson._name)
                        // console.log("numLikes: " + currentPerson._numLikes)
                        // console.log("numPosts: " + currentPerson.numPosts)
                        DBScoreArray[scoreIndex]._numLikes += currentPerson._numLikes;
                        DBScoreArray[scoreIndex]._numPosts += currentPerson._numPosts;
                        console.log("Updated person: " + DBScoreArray[scoreIndex]._name)
                        //console.log(DBScoreArray[scoreIndex]);


                      } else {  //else add new person
                        let newPerson = {
                          "_name": Members[i]._name,
                          "_userID": Members[i]._userID,
                          "_numPosts": Members[i]._numPosts,
                          "_numLikes": Members[i]._numLikes
                        }
                        console.log("pushing person: ");
                        console.log(newPerson);
                        DBScoreArray.push(newPerson);
                      }
                    })

                }

                mongo.pushScores(DBScoreArray); //push array into mongoDB
                resolve(DBScoreArray);
              })
          })
      })
  })
}

// returns the first person in scorearr with the userID of the currentPerson
// returns undefined otherwise
function personIfExists(DBScoreArray, currentPerson) {
  return new Promise((resolve, reject) => {
    var personIfExists = DBScoreArray.find(obj => {
      return obj._userID == currentPerson._userID;
    })
    resolve(personIfExists);
  })
}





//Easter Egg
//Posts "Guilty!" if someone asks "Verdict?"
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


// postResults
//Posts Leaderboard
//   also has highest post of all time appended to bottom
// function postResults(senderID) {

//   var botResponse, options, body, botReq;
//   const Admins = ['18197056', '39735084', '30109965', '46367350', '46537569'];  //array filled with user_id's of members that are allowed to display scoreboard
//   //             [ Izu       ,  Uzair   ,  Dan      ,  Ahmad    ,  Mohamed Yusuf]

//   if (Admins.includes(senderID)) {
//     responseString = createOutput()
//     highestObj = mongo.highestToString()

//     Promise.all([responseString, highestObj]).then((resultArray) => {
//       console.log(resultArray[1])
//       botResponse = resultArray[0]; //Should be in string form
//       botResponse += "\n" + resultArray[1].result;

//       options = {
//         hostname: 'api.groupme.com',
//         path: '/v3/bots/post',
//         method: 'POST'
//       };

//       body = {
//         "bot_id": botID,
//         "text": botResponse,
//         "attachments": [
//           {
//             "type": "image",
//             "url": resultArray[1].imgURL
//           }
//         ]
//       };


//       console.log('sending ' + botResponse + ' to ' + botID);

//       botReq = HTTPS.request(options, function (res) {
//         if (res.statusCode == 202) {
//           //neat
//         } else {
//           console.log('rejecting bad status code ' + res.statusCode);
//         }
//       });

//       botReq.on('error', function (err) {
//         console.log('error posting message ' + JSON.stringify(err));
//       });
//       botReq.on('timeout', function (err) {
//         console.log('timeout posting message ' + JSON.stringify(err));
//       });
//       botReq.end(JSON.stringify(body));
//     }
//     )

//   }
//   else { //not allowed
//     botResponse = "Sorry, you do not have permission to do this.";//; + "\n senderID: " + senderID; //Should be in string form

//     options = {
//       hostname: 'api.groupme.com',
//       path: '/v3/bots/post',
//       method: 'POST'
//     };

//     body = {
//       "bot_id": botID,
//       "text": botResponse
//     };


//     console.log('sending ' + botResponse + ' to ' + botID);

//     botReq = HTTPS.request(options, function (res) {
//       if (res.statusCode == 202) {
//         //neat
//       } else {
//         console.log('rejecting bad status code ' + res.statusCode);
//       }
//     });

//     botReq.on('error', function (err) {
//       console.log('error posting message ' + JSON.stringify(err));
//     });
//     botReq.on('timeout', function (err) {
//       console.log('timeout posting message ' + JSON.stringify(err));
//     });
//     botReq.end(JSON.stringify(body));
//   }
// }




/**
 * Posts Leaderboard
 * also has highest post of all time appended to bottom
 */
function postDBResults(senderID, DBScoresArray) {

  var botResponse, options, body, botReq;
  const Admins = ['18197056', '39735084', '30109965', '46367350', '46537569'];  //array filled with user_id's of members that are allowed to display scoreboard
  //[ Izu       ,  Uzair   ,  Dan      ,  Ahmad    ,  Mohamed Yusuf]

  if (Admins.includes(senderID)) {
    responseString = createDBOutput(DBScoresArray)
    highestObj = mongo.highestToString()

    Promise.all([responseString, highestObj]).then((resultArray) => {
      //console.log(resultArray[1])
      botResponse = resultArray[0]; //Should be in string form
      botResponse += "\n" + resultArray[1].highestString;

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
            "url": resultArray[1].imgURL
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


//Posts highest post of all time
function postHighest(senderID) {
  var botResponse, options, body, botReq;

  const Admins = ['18197056', '39735084', '30109965', '46367350', '46537569'];  //array filled with user_id's of members that are allowed to display scoreboard
  //             [ Izu       ,  Uzair   ,  Dan      ,  Ahmad    ,  Mohamed Yusuf]

  if (Admins.includes(senderID)) {
    mongo.highestToString()
      .then(givenObj => {

        botResponse = givenObj.highestString;

        console.log("botResponse: " + givenObj.highestString);
        console.log("imgURL: " + givenObj.imgURL);
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
              "url": givenObj.imgURL
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
  } else { //not allowed
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





exports.respond = respond; 