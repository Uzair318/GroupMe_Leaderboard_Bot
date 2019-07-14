class Person {
    constructor(givenName) {
        this.name = givenName;
        this.numPosts = 0;
        this.numLikes = 0;

    }

    get name() {
        return this.name;
    }
    get numPosts() {
        return this.numPosts;
    }
    get numLikes() {
        return this.numLikes;
    }

    plusPost(num) {
        this.numPosts += num;
    }
    
    plusLikes(num) {
        this.numLikes += num;
    }


} //Person