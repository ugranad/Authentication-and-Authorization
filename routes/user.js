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
  //check for token
  let token = req.get('Authorization');
  if (token) {
    //decode the jwt and verify
    var decoded = jwt.decode(token, { complete: true });
    jwt.verify(token, 'secret', (err, response) => {
      if (err) {
        return res.send({ msg: 'Token Malformed' })
      } else {
        User.findOne({ email: decoded.payload.email }, (err, user) => {
          if (err) res.send(err);
          //Check for user
          if (user) {
            //Check for role
            if (user.role === 'admin') {
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




//Login 
router.post('/login',
  passport.authenticate('local'),
  function (req, res) {
    console.log(req.user);
    //Check for role of the user
    if (req.user.role === 'admin') {
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


//Register (for initial register remove is_admin below)
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
    role: req.body.role
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

//List staff
router.get('/staff', (req, res) => {
  User.find({ role: 'staff' }, (err, result) => {
    if (err) throw err;
    res.send(result);
  })
});

//List Admin
router.get('/admin', (req, res) => {
  User.find({ role: 'admin' }, (err, result) => {
    if (err) throw err;
    res.send(result);
  })
});


// Reset password
router.put('/reset_password', (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return res.send(err)
    if (user) {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.new_password, salt, (err, hash) => {
          if (err) return res.send(err);
          console.log(hash)
          console.log(user.password)
          req.body.new_password = hash;
          User.updateOne({ email: user.email }, { $set: { password: hash } }, (err, result) => {
            if (err) return res.send(err);
            return res.send({ user, result })
          })
        })
      })
    }
  })
})



















// router.put('/reset_password', (req, res) => {
//   //Match User
//   User.findOne({ email: req.body.email }, (err, user) => {
//     console.log(user);
//     if (err) return res.status(400).send({ message: "User not found" })
//     if (user) {
//       //compare old_password
//       bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
//         if (err) throw err;
//         console.log(isMatch);
//         if (isMatch) {
//           //Hash the new password
//           bcrypt.genSalt(10, (err, salt) => {
//             bcrypt.hash(req.body.new_password, salt, (err, hash) => {
//               if (err) throw err
//               req.body.new_password = hash;
//               User.replaceOne({ password: req.body.password }, { password: req.body.new_password }, (err, result) => {
//                 console.log(req.body.new_password)
//                 if (err) throw err;
//                 return res.send({ msg: user, result });
//               })
//             })
//           })
//         } else {
//           return res.send({ msg: 'Incorrect password' })
//         }
//       })
//     }
//   })
// })

//Remove user
router.delete('/:name/remove', is_admin, (req, res) => {
  User.findOneAndRemove(req.params, (err, result) => {
    if (err) throw err;
    res.send({ msg: 'User removed', result: result })
  })
})



module.exports = router;
