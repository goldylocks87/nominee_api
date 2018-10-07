const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const { Nominee } = require('./../../models/nominee');
const { User } = require('./../../models/user');

const userOneId = new ObjectId();
const userTwoId = new ObjectId();

// users for testing
const users = [
    {
        _id: userOneId,
        email: 'test@user1.com',
        password: 'Onepassword123!',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
        }]
    },
    {
        _id: userTwoId,
        email: 'test2@user2.com',
        password: 'Twopassword123!',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString()
        }]
    }];

// test result records for testing
const nominees = [
    {
        _id: new ObjectId(),
        _creator: userOneId,
        name: 'test1',
        email: 'test1@nominee1.com',
        votes: 1
    }, {
        _id: new ObjectId(),
        _creator: userTwoId,
        name: 'test2',
        email: 'test2@nominee2.com',
        votes: 2
    }
];

const populateNominees = (done) => {
    Nominee.remove({}).then(() => {
        return Nominee.insertMany( nominees );
    }).then(() => done());
};

const populateUsers = (done) => {
    User.remove({}).then(() => {
        let userOne = new User( users[0] ).save();
        let userTwo = new User( users[1] ).save();

        // this will wait for all promises to complete then call then
        return Promise.all([userOne, userTwo]); // returning
    }).then(() => done());
};

module.exports = {
    nominees, populateNominees,
    users, populateUsers
}