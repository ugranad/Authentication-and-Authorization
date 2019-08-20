const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();


//load user model
require('../model/User')
const User = mongoose.model('users');


//JWT middle-ware
function is_admin(req, res, next) {
  let token = req.get('Authorization');
  if (token) {
    var decoded = jwt.decode(token, { complete: true });
    jwt.verify(token, 'secret', (err, response) => {
      if (err) {
        return res.send({ msg: 'Token Malformed' })
      } else {
        User.findOne({ email: decoded.payload.email }, (err, user) => {
          if (err) res.send(err);
          if (user) {
            if (user.roles === 'admin') {
              req.user = user.email
              next();
            } else {
              return res.send({ msg: 'Unauthorized' })
            }
          } else {
            return res.send({ msg: 'User not found' })
          }
        })
      }
    })
  } else {
    return res.send({ msg: 'Missing Token' })
  }
}

//GET API Test
router.get('/test', (req, res) => {
  res.send('TEST');
});




//Login POST
router.post('/login',
  passport.authenticate('local'),
  function (req, res) {
    if (req.user.roles === 'admin') {
      jwt.sign({ email: req.user.email }, 'secret', { expiresIn: 60 * 10 }, (err, token) => {
        console.log(err, token);
        if (err) throw err;
        return res.send({ user: req.user.email, token: token });
      })
    } else {
      return res.send({ user: req.user.email, msg: 'Logged in ' })
    }
  }


);


//Register POST for initial register remove is_admin below
router.post('/register', is_admin, (req, res) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        return res.send({ msg: 'Email already exists' })
      }
    })
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    roles: req.body.roles
  })
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) throw err;
      user.password = hash;
      user.save()
        .then(user => res.send({ user: user }))
        .catch(err => res.send(err))

    })
  })


})







module.exports = router;