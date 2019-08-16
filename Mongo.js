const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    "count": Number,
    "bestPost": { //owner of the post that has recieved the most likes
        "owner": String,
        "numLikes": Number,
        "text" : String,
        "img_url" : String
    }
});
const Configs = mongoose.model('Configs', schema);

class Mongo {
    constructor() {
        this.mongoURI = process.env.MONGO_URI;
        mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    }

    //Need an updateBestPost() function
        //need criteria set for evaluating if a post is eligible 
    
    getCount() {
        return new Promise((resolve, reject) => {
            Configs.findOne({}, (error, config) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(config.count);
                }
            });
        });
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
                    if(foundObject.count == 99) {
                        foundObject.count = 0;
                        foundObject.save((err, updatedObject) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(true);
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
                if(error) {
                    reject(error);
                } else {
                    console.log("config.personWithMostLikes.owner")
                    console.log(config.personWithMostLikes.owner)
                    resolve(config.personWithMostLikes.owner)
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
                    resolve(config.numLikes);
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
                    resolve(config.text);
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
                    resolve(config.img_url);
                }

            });
        });
    }


}

module.exports = Mongo;