const { User } = require('./../models/user');

let authenticate = (req, res, next) => {
    const token = req.header('x-auth');

    User.findByToken(token)
    .then((user) => {
        if (!user) {
            // reject here to call the catch block
            return Promise.reject();
        }

        req.user = user;
        req.token = token;
        next();
    })
    .catch( err => res.status(401).send() );
};

module.exports = { authenticate };