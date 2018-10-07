const expect = require('expect');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { app } = require('./../server');
const { Nominee } = require('./../models/nominee');
const { User } = require('./../models/user');
const { nominees, 
        populateNominees,
        users,
        populateUsers } = require('./seed/seed');


// clear the db before each test
beforeEach(populateUsers);
beforeEach(populateNominees);

describe('POST /nominees', () => {
    
    it('should create a new nominee', (done) => {

        let newNominee = 
            {
                "name": "test3",
                "email": "newNominee@nominee3.com",
                "votes": 1,
            };

        request(app)
            .post('/nominees')
            .set('x-auth', users[0].tokens[0].token)
            .send(newNominee)
            .expect(200)
            .expect((res) => {
                expect(res.body.name).toBe('test3');
                expect(res.body.email).toBe('newNominee@nominee3.com');
            })
            .end((err, res) => {
                if(err) return done(err);

                // make sure we can find it in the db
                Nominee.findOne({email: newNominee.email})
                .then((docs) => {
                    expect(docs.email)
                    .toBe(newNominee.email);
                    
                    done();
                }).catch((err) => done(err));
            });
    });

    it('should not create a nominee with a bad body', (done) => {
        request(app)
            .post('/nominees')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end(done);
    });
});

describe('GET /nominees', () => {

    it('should get all nominees for this user', (done) => {
        request(app)
            .get('/nominees')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.nominees.length)
                .toBe(1);
            })
            .end((err, res) => {
                if(err) return done(err);

                // make sure the db has all the nominees
                Nominee.find({})
                .then((nominees) => {
                    expect(nominees.length)
                    .toBe(2);
                    
                    done();
                }).catch((err) => done(err));
            });
    })
});

describe('GET /nominees/:id', () => {

    it('should return Nominee by id', (done) => {
        request(app)
            .get(`/nominees/${nominees[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.nominees.email)
                .toBe(nominees[0].email);
            })
            .end(done);
    })

    it('should not return a Nominee created by a different user', (done) => {
        request(app)
            .get(`/nominees/${nominees[1]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    })

    it('should return an error 404 if Nominee not found', (done) => {

        let hexId = new ObjectId().toHexString();

        request(app)
            .get(`/nominees/${hexId}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .expect((res) => {
                expect(res.body.error.length).toBeGreaterThan(0);
            })
            .end(done);
    });

    it('should return an error 404 if id is not valid', (done) => {
        request(app)
            .get('/nominees/123')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /nominees/:id', () => {

    it('should update a nominee', (done) => {

        // change a prop 
        let updatedNominee = nominees[0];
        updatedNominee.votes = 5;

        request(app)
            .patch(`/nominees/${nominees[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .send(updatedNominee)
            .expect(200)
            .end((err, res) => {
                if(err) return done(err);

                // make sure the db has all the nominees
                Nominee.findById(nominees[0]._id)
                .then((nominees) => {
                    expect(nominees)
                    .toBeTruthy();
                    expect(nominees.votes)
                    .toEqual(updatedNominee.votes);
                    
                    done();
                }).catch((err) => done(err));
            });
    })

    it('should not update a nominee created by another user', (done) => {

        // change a prop 
        let updatedNominee = nominees[0];
        updatedNominee.votes = 6;

        request(app)
            .delete(`/nominees/${nominees[0]._id.toHexString()}`)
            .set('x-auth', users[1].tokens[0].token)
            .send(updatedNominee)
            .expect(404)
            .end((err, res) => {
                if(err) return done(err);

                // make sure the db has all the nominees
                Nominee.findById(nominees[0]._id)
                .then((nominees) => {
                    expect(nominees.votes)
                    .not.toBe(updatedNominee.votes);
                    
                    done();
                }).catch((err) => done(err));
            });
    })
});

describe('DELETE /nominees/:id', () => {

    it('should remove a nominee', (done) => {
        request(app)
            .delete(`/nominees/${nominees[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if(err) return done(err);

                // make sure the db has all the nominees
                Nominee.findById(nominees[0]._id)
                .then((nominees) => {
                    expect(nominees)
                    .toBeFalsy();
                    
                    done();
                }).catch((err) => done(err));
            });
    })

    it('should not remove a nominee created by another user', (done) => {
        request(app)
            .delete(`/nominees/${nominees[1]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if(err) return done(err);

                // make sure the db has all the nominees
                Nominee.findById(nominees[1]._id)
                .then((docs) => {
                    expect(docs._id)
                    .toEqual(nominees[1]._id);
                    
                    done();
                }).catch((err) => done(err));
            });
    })
});

// user tests
describe('GET /users/me', () => {

    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done);
    })

    it('should return a 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', '')
            .expect(401)
            .expect((res) => {
                expect(res.body._id).toBeUndefined;
            })
            .end(done);
    })
});

describe('POST /users', () => {

    let newUser = 
        {
            email: 'new@email.com', 
            password: 'newPassword123!'
        };

    it('should create a user', (done) => {
        request(app)
            .post('/users')
            .send(newUser)
            .expect(200)
            .expect((res) => {
                expect(res.body.email).toBe(newUser.email);
            })
            .end((err) => {
                if (err) done(err);

                User.findOne({email: newUser.email})
                .then((user) => {
                    expect(user).toBeTruthy();
                    expect(user.password).not.toBe(newUser.password);
                    done();
                }).catch(err => done(err));
            });
    })

    it('should not create a user with an invalid email', (done) => {
        request(app)
            .post('/users')
            .send({email: 'bad', password: newUser.password})
            .expect(400)
            .end(done);
    })

    it('should not create a user with an invalid password', (done) => {
        request(app)
            .post('/users')
            .send({email: newUser.email, password: ''})
            .expect(400)
            .end(done);
    })

    it('should not create a user with a duplicate email', (done) => {
        request(app)
            .post('/users')
            .send(users[0])
            .expect(400)
            .end(done);
    })
});

describe('POST /users/login', () => {

    it('should login user and return auth token', (done) => {

        let email = users[1].email;
        let password = users[1].password;

        request(app)
            .post('/users/login')
            .send({email, password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth'])
                .toBeTruthy();
            })
            .end((err, res) => {
                if (err) done(err);

                User.findById(users[1]._id)
                .then((user) => {
                    expect(user.tokens.length)
                    .toBe(2)
                    expect(user.tokens[1].token)
                    .toBe(res.headers['x-auth']);
                    done();
                }).catch(err => done(err));
            });
    })

    it('should reject a login with an incorrect password', (done) => {

        let email = users[1].email;
        let password = 'FakePassword123';

        request(app)
            .post('/users/login')
            .send({email, password})
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth'])
                .toBeFalsy();
            })
            .end((err, res) => {
                if (err) done(err);

                User.findById(users[1]._id)
                .then((user) => {
                    expect(user.tokens.length)
                    .toBe(1)
                    done();
                }).catch(err => done(err));
            });
    })
});

describe('DELETE /users/me/token', () => {

    it('should remove auth token from a users token array', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth'])
                .toBeFalsy();
            })
            .end((err, res) => {
                if (err) done(err);

                User.findById(users[0]._id)
                .then((user) => {
                    expect(user.tokens.length)
                    .toBe(0)
                    done();
                }).catch(err => done(err));
            });
    })
});