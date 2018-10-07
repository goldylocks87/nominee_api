const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

let UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

// overriding this method
UserSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
};

// arrow functions do not bind a this prop so using reg function
UserSchema.methods.generateAuthToken = function () {
    let user = this;
    let access = 'auth';
    let token = jwt.sign(
        { 
            _id: user._id.toHexString(), 
            access: access 
        }, 
        process.env.JWT_SECRET).toString();

    // adds the token to the tokens array on the user
    user.tokens = user.tokens.concat([{access, token}]);

    // return here so we can tack on then() later
    // and access to token generated here
    return user.save().then(() => {
        return token;
    });
};

// arrow functions do not bind a this prop so using reg function
UserSchema.methods.removeToken = function (token) {
    let user = this;

    return user.update({
        // mongo db $pull to remove a prop
        $pull: {
            tokens: {
                token: token
            }
        }
    })
};

// model method
UserSchema.statics.findByToken = function (token) {
    let User = this;
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        // shorthand to return a rejected promise
        return Promise.reject(err);
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

UserSchema.statics.findByCredentials = function (email, password) {
    let User = this;

    return User.findOne({ email })
        .then((user) => {
            
            if (!user) {
                return Promise.reject('Uh oh, we couldn\'t find a user with that email.');
            }
            return new Promise((resolve, reject) => {
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (isMatch) resolve(user);
                    else reject('Uh oh, you password is incorrect.');
                });
            });
        });
};

// pre middleware
UserSchema.pre('save', function (next) {

    let user = this;
    if (user.isModified('password')) {

        // salt the pw
        bcrypt.genSalt(10, (err, salt) => {

            // hash && store the pw
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    }
    else next();
});

var User = mongoose.model('User', UserSchema);

module.exports = { User };