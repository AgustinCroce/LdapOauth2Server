/*jslint node: true */
'use strict';

var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var WindowsStrategy = require('passport-windowsauth');
var config = require('./config');
var db = require('./' + config.db.type);

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(
    function(username, password, done) {
        console.log(username, password);
        db.clients.findByClientId(username, function(err, client) {
            if (err) {
                return done(err);
            }
            if (!client) {
                return done(null, false);
            }
            if (client.clientSecret != password) {
                return done(null, false);
            }

            return done(null, client);
        });
    }
));

/**
 * Client Password strategy
 *
 * The OAuth 2.0 client password authentication strategy authenticates clients
 * using a client ID and client secret. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
 */
passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
        console.log(clientId, clientSecret);
        db.clients.findByClientId(clientId, function(err, client) {
            if (err) {
                return done(err);
            }
            if (!client) {
                return done(null, false);
            }
            if (client.clientSecret != clientSecret) {
                return done(null, false);
            }

            return done(null, client);
        });
    }
));

passport.use(new WindowsStrategy({
        ldap      : {
            url            : "ldap://10.1.0.45:389",
            base           : "dc=exo,dc=local",
            bindDN         : "user@exo.local",
            bindCredentials: "pass"
        },
        integrated: false
    },
    function(profile, done) {
        db.users.find({
            id: profile.id
        }, function(err, users) {
            if (users.length === 1) {
                done(null, users[0]);
            } else {
                db.users.create({
                    id         : profile.id,
                    displayName: profile.displayName,
                    emails     : profile.emails
                }, done)
            }
        });
    }));

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.users
        .find({id: id})
        .limit(1)
        .exec(function(err, user) {
            if (err) {
                done(err, null);
            } else {
                done(null, user[0]);
            }
        });
});
