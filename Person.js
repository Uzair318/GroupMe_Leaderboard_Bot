const sprintf = require('sprintf');

class Person {
    constructor(givenName, id) {
        this._name = givenName;
        this._userID = id;
        this._numPosts = 0;
        this._numLikes = 0;

        //this._likePostRatio = this._numLikes / this.numPosts;
    }


    set name(givenName) {
        this._name = givenName;
    }

    set ID(id) {
        this._userID = id;
    }
    /*
    set likePostRatio(likes, posts) {
        this._likePostRatio = likes + posts;
    }*/

    get name() {
        return this._name;
    }
    get ID() {
        return this._userID;
    }
    get numPosts() {
        return this._numPosts;
    }
    get numLikes() {
        return this._numLikes;
    }
    /*
    get likePostRatio() {
        return this._likePostRatio;
    }*/


    plusPost(num) {
        this._numPosts += num;
        this._likePostRatio
    }
    
    plusLikes(num) {
        this._numLikes += num;
    }

    likePostRatio() {
        return (this._numLikes/this._numPosts);
    }

    toString() {
        var ratioString = "Like-Post ratio: " + (this.likePostRatio().toFixed(2)).padStart(5);
        return (this._name.substring(0,15).padEnd(16) + ratioString);        
        //return sprintf("%s %s", this._name.substring(0, 15)/*.padEnd(16)*/, ratioString.padStart(33, " "));

            //doesnt matter if it is spaced correctly, GroupMe app will ruin it
    }
}; //Person 

module.exports = Person;