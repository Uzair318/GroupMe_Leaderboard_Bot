const mongoose = require('mongoose');

/**
 * Need to update so we can have an array of people in MongoDB to keep track of running scores
 * https://stackoverflow.com/questions/33049707/push-items-into-mongo-array-via-mongoose
 */

const schema = new mongoose.Schema({
    "count": Number,
    "bestPost": { //owner of the post that has recieved the most likes
        "owner": String,
        "numLikes": Number,
        "text": String,
        "img_url": String
    },
    "scores": [{
        "_name": String,
        "_userID": String,
        "_numPosts": Number,
        "_numLikes": Number
    }]
});
const Configs = mongoose.model('Configs', schema);

class Mongo {
    constructor() {
        this.mongoURI = process.env.MONGO_URI;
        mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    }

    //gets the array of running scores from MongoDB
    getScores() {
        return new Promise((resolve, reject) => {
            Configs.findOne({ _id: "5d531bcc976118190c32c83b" }, (error, config) => {
                if (error) {
                    reject(error);
                } else {
                    //console.log(config.scores);
                    resolve(config.scores);
                }
            });
        });
    }

    pushScores(scoresArray) {
        return new Promise((resolve, reject) => {
            Configs.findOne({ _id: "5d531bcc976118190c32c83b" }, (error, config) =>{
                if(error) {
                    reject(error);
                } else {
                    config.scores = scoresArray;
                    config.save((err, updated) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log("updated scoresArray")
                            resolve(updated.scores);
                        }
                    });
                }
                
            })
        })
    }


    //gets the number of posts since last auto-post
    getCount() {
        return new Promise((resolve, reject) => {
            Configs.findOne({}, (error, config) => {
                if (error) {
                    reject(error);
                } 
                else {
                    console.log(config.count);
                    resolve(config.count);
                }
            });
        });
    }

    /**
     * posts the new highest ranking post to mongoDB
     *  @param newHighestPost is the message (JSON) passed in from getMemberStats to be pushed to mongoDB
     */
    updateHighest(newHighestPost) {
        return new Promise((resolve, reject) => {
            Configs.findOne({}, (err, oldHighestPost) => {
                if (err) {
                    reject(err);
                } else {
                    if (!oldHighestPost) {
                        console.log("no object found");
                        return -1;
                    }

                    //update the bestPost object
                    oldHighestPost.bestPost.owner = newHighestPost.name;
                    oldHighestPost.bestPost.numLikes = newHighestPost.favorited_by.length;
                    oldHighestPost.bestPost.text = newHighestPost.text;
                    oldHighestPost.bestPost.img_url = newHighestPost.attachments[0].url;
                    oldHighestPost.save((err, updatedHighestPost) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(updatedHighestPost);
                        }
                    });

                }
            })
        })
    }

    /**
     * returns TRUE if count hits 100 and is reset
     * else returns count
     */
    incrementCount() {
        return new Promise((resolve, reject) => {

            Configs.findOne({}, (err, foundObject) => {
                if (err) {
                    reject(err);
                } else {
                    if (!foundObject) {
                        console.log("no object found");
                        return -1;
                    }
                    if (foundObject.count == 79) {
                        foundObject.count = 0;
                        foundObject.save((err, updatedObject) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(80);
                            }
                        });
                    } else {
                        foundObject.count++;
                        foundObject.save((err, updatedObject) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(updatedObject.count);
                            }
                        });
                    }




                }
            });
        });
    }

    getOwner() {
        return new Promise((resolve, reject) => {
            Configs.findOne({}, (error, config) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(config.bestPost.owner)
                }
            })
        })
    }

    getNumLikes() {
        return new Promise((resolve, reject) => {
            Configs.findOne({}, (error, config) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(config.bestPost.numLikes);
                }


            });
        });
    }

    getText() {
        return new Promise((resolve, reject) => {
            Configs.findOne({}, (error, config) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(config.bestPost.text);
                }
            });
        });
    }

    getURL() {
        return new Promise((resolve, reject) => {
            Configs.findOne({}, (error, config) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(config.bestPost.img_url);
                }

            });
        });
    }

    highestToString() {
        return new Promise((resolve, reject) => {
            var result = "Highest Post of All Time: \n";
            Configs.findOne({}, (error, config) => {
                if (error) {
                    reject(error);
                } else {
                    result += "by " + config.bestPost.owner + " with " + config.bestPost.numLikes + " likes \n"
                    if (config.bestPost.text) {
                        result += "\t + \"" + config.bestPost.text + "\"";
                    }
                    let resultObj = {
                        highestString: result,
                        imgURL: config.bestPost.img_url
                    }
                    console.log(resultObj)
                    resolve(resultObj); //dont forget to post an attachment, type image, with imgURL
                }

            });
        });
    }

}

module.exports = Mongo;