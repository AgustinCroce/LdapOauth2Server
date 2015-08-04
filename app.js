/*jslint node: true */
/* global require */

'use strict';
var mongoose = require('mongoose');
var config = require('./config');
var express = require('express');
var passport = require('passport');
var site = require('./site');
var oauth2 = require('./oauth2');
var token = require('./token');
var https = require('https');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var expressSession = require("express-session");
var path = require('path');
var cors = require('cors');
var AccessTokens = require('./mongodb').accessTokens;

mongoose.connect('mongodb://localhost:27017/Oauth');

//Pull in the mongo store if we're configured to use it
//else pull in MemoryStore for the session configuration
var sessionStorage;
var MemoryStore = expressSession.MemoryStore;
console.log('Using MemoryStore for the Session');
sessionStorage = new MemoryStore();

//Pull in the mongo store if we're configured to use it
//else pull in MemoryStore for the database configuration
console.log('Using MemoryStore for the data store');

// Express configuration
var app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(cors());

//Session Configuration
app.use(expressSession({
    saveUninitialized: true,
    resave           : true,
    secret           : config.session.secret,
    store            : sessionStorage,
    key              : "authorization.sid",
    cookie           : {maxAge: config.session.maxAge}
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./auth');

app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);

app.get('/dialog/authorize', oauth2.authorization);
app.post('/dialog/authorize/decision', oauth2.decision);
app.post('/oauth/token', oauth2.token);

// Mimicking google's token info endpoint from
// https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
app.get('/api/tokeninfo', token.info);


//static resources for stylesheets, images, javascript files
app.use(express.static(path.join(__dirname, 'public')));

// Catch all for error messages.  Instead of a stack
// trace, this will log the json of the error message
// to the browser and pass along the status with it
app.use(function(err, req, res, next) {
    if (err) {
        res.status(err.status);
        res.json(err);
    } else {
        next();
    }
});

//From time to time we need to clean up any expired tokens
//in the database
setInterval(function() {
    console.log("Deleting accessTokens");
    AccessTokens.removeExpired(function(err) {
        if (err) {
            console.error("Error removing expired tokens");
        }
        console.log("Access tokens deleted");
    });
}, config.db.timeToCheckExpiredTokens * 1000);

//TODO: Change these for your own certificates.  This was generated
//through the commands:
//openssl genrsa -out privatekey.pem 1024
//openssl req -new -key privatekey.pem -out certrequest.csr
//openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
var options = {
    key : fs.readFileSync('certs/privatekey.pem'),
    cert: fs.readFileSync('certs/certificate.pem')
};

// Create our HTTPS server listening on port 3000.
https.createServer(options, app).listen(3000);
console.log("OAuth 2.0 Authorization Server started on port 3000");


