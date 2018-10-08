require('./config/config.js');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');

const { mongoose } = require('./db/mongoose');

const { Nominee } = require('./models/nominee');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT; 

app.use( bodyParser.json() );

app.post('/nominees', authenticate, (req, res) => {

    req.body._creator = req.user._id;

    var nominee = new Nominee(req.body);

    nominee.save().then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err); 
    }).catch(err => console.error(err));
});

app.get('/nominees', authenticate, (req, res) => {

    Nominee.find({_creator: req.user._id})
    .then((nominees) => {
        res.send({nominees});
    },(err) => {
        res.status(400).send(err); 
    }).catch(err => console.error(err));
});

app.get('/nominees/:id', authenticate, (req, res) => {

    let id = req.params.id;

    if( !ObjectId.isValid(id) ){
        return res.status(404).send({error: 'Could not find that ish...'}); 
    }

    Nominee.findOne({_id: id, _creator: req.user._id})
    .then((nominees) => {
        if(!nominees) res.status(404).send({error: 'Could not find that ish...'}); 
        else res.send({nominees});

    }).catch((err) => {
        res.status(400).send({error: 'Bad shit happened...'})
    }); 
});

app.delete('/nominees/:id', authenticate, (req, res) => {

    let id = req.params.id;

    if( !ObjectId.isValid(id) ){
        return res.status(404).send({error: 'Could not find that ish...'}); 
    }

    Nominee.findOneAndRemove({_id: id, _creator: req.user._id})
    .then((nominees) => {
        if(!nominees) res.status(404).send({error: 'Could not find that ish...'}); 
        else res.send({nominees});
        
    }).catch((err) => {
        res.status(400).send({error: 'Bad shit happened...'})
    }); 
});

app.patch('/nominees/:id', authenticate, (req, res) => {

    let id = req.params.id;

    if( !ObjectId.isValid(id) ){
        return res.status(404).send({error: 'Could not find that ish...'}); 
    }

    Nominee.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: req.body}, {new: true})
    .then((nominees) => {
        if(!nominees) res.status(404).send({error: 'Could not find that ish...'}); 
        else res.send({nominees});

    }, (err) => {
        res.status(400).send({error: 'Bad shit happened...'})
    }).catch(err => console.error(err)); 
});

app.put('/nominees/:id/:vote', authenticate, (req, res) => {

    let id = req.params.id;
    let newVote = req.params.vote;

    if( !ObjectId.isValid(id) ){
        return res.status(404).send({error: 'Could not find that ish...'}); 
    }

    Nominee.findOneAndUpdate(
        {_id: id, _creator: req.user._id}, 
        {$inc: {votes: newVote}}, 
        {new: true})
    .then((nominees) => {
        if(!nominees) res.status(404).send({error: 'Could not find that ish...'}); 
        else res.send({nominees});

    }, (err) => {
        res.status(400).send({error: 'Bad shit happened...'})
    }).catch(err => console.error(err)); 
});

app.post('/users', (req, res) => {

    // pick off props that we want users to be able to set
    let body = _.pick(req.body, ['email','password']);

    let user = new User(body);

    user.save()
    .then(() => {
        return user.generateAuthToken();
    })
    .then((token) => {
        // x- denotes a custom header prop
        res.header('x-auth', token).send(user);
    })
    .catch( err => res.status(400).send(err) );
});

app.get('/users/me', authenticate, (req, res) => {

    res.send(req.user); // from the authenticate middleware
});

app.post('/users/login', (req, res) => {

    // pick off props that we want users to be able to set
    let body = _.pick(req.body, ['email','password']);

    User.findByCredentials(body.email, body.password)
    .then((user) => {
        user.generateAuthToken().then((token) => {
            // x- denotes a custom header prop
            res.header('x-auth', token).send(user);
        })
    }).catch(err => {
        res.status(400).send(err);
    });
});

app.delete('/users/me/token', authenticate, (req, res) => {

    req.user.removeToken(req.token)
    .then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    })
});

module.exports = { app };

app.listen(port, () => {
    console.log(`started app on port ${port}...`);
});