const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');



//load user route
const users = require('./routes/user');

// load passport
require('./config/passport')(passport);


const app = express();
const port = 3000;

mongoose.Promise = global.Promise


//Mongodb connection
mongoose.connect('mongodb://localhost:27017/auth', { useNewUrlParser: true })
  .then(re => console.log('Connected to auth DB'))
  .catch(err => console.log(err));


//Body-Parser middle-ware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Morgan middle-ware
app.use(morgan('dev'));



//Express-session middle-ware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

//Passport Middle-ware
app.use(passport.initialize());
app.use(passport.session());

//Routes middle-ware
app.use('/user', users);



app.listen(port, () => console.log(`server is running on port ${port}`));