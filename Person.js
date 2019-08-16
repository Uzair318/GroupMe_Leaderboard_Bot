const sprintf = require('sprintf');

class Person {
    constructor(givenName, id) {
        this._name = givenName;
        this._ID = id;
        this._numPosts = 0;
        this._numLikes = 0;

        //this._likePostRatio = this._numLikes / this.numPosts;
    }

    set name(givenName) {
        this._name = givenName;
    }

    set ID(id) {
        this._ID = id;
    }
    /*
    set likePostRatio(likes, posts) {
        this._likePostRatio = likes + posts;
    }*/

    get name() {
        return this.name;
    }
    get ID() {
        return this._ID;
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
        //return "" + /*this._name.padEnd(20)*/this._name.substring(0,12).padEnd(20) + " Like-Post ratio: " + this.likePostRatio().toFixed(2);    
        return sprintf("%s %27s $s", this._name, "Like-Post ratio: ", this.likePostRatio().toFixed(2));
    }

}; //Person 

module.exports = Person;