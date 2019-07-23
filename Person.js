class Person {
    constructor(givenName, id) {
        this._name = givenName;
        this._ID = id;
        this._numPosts = 0;
        this._numLikes = 0;

    }

    set name(givenName) {
        this._name = givenName;
    }

    set ID(id) {
        this._ID = id;
    }

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

    plusPost(num) {
        this._numPosts += num;
    }
    
    plusLikes(num) {
        this._numLikes += num;
    }


}; //Person 

module.exports = Person;