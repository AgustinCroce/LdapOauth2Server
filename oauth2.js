/*jslint node: true */
'use strict';

/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize');
var passport = require('passport');
var login = require('connect-ensure-login');
var config = require('./config');
var db = require('./mongodb');
var utils = require('./utils');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

/**
 * Grant implicit authorization.
 *
 * The callback takes the `client` requesting authorization, the authenticated
 * `user` granting access, and their response, which contains approved scope,
 * duration, etc. as parsed by the application.  The application issues a token,
 * which is bound to these values.
 */
server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    var token = utils.uid(config.token.accessTokenLength);
    db.accessTokens.create({
        token: token,
        userID: user._id,
        expirationDate: config.token.calculateExpirationDate(),
        clientID: client.id,
        scope: '*'
    }, function(err){
        if (err) {
            return done(err);
        }
        return done(null, token, {expires_in: config.token.expiresIn});
    });
}));

/**
 * Exchange the refresh token for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id from the token
 * request for verification.  If this value is validated, the application issues an access
 * token on behalf of the client who authorized the code
 */
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
    db.refreshTokens.find(refreshToken, function(err, authCode) {
        if (err) {
            return done(err);
        }
        if (!authCode) {
            return done(null, false);
        }
        if (client.id !== authCode.clientID) {
            return done(null, false);
        }
        var token = utils.uid(config.token.accessTokenLength);
        db.accessTokens.save(token, config.token.calculateExpirationDate(), authCode.userID, authCode.clientID,
            authCode.scope, function(err) {
                if (err) {
                    return done(err);
                }
                return done(null, token, null, {expires_in: config.token.expiresIn});
            });
    });
}));

/**
 * User authorization endpoint
 *
 * `authorization` middleware accepts a `validate` callback which is
 * responsible for validating the client making the authorization request.  In
 * doing so, is recommended that the `redirectURI` be checked against a
 * registered value, although security requirements may vary accross
 * implementations.  Once validated, the `done` callback must be invoked with
 * a `client` instance, as well as the `redirectURI` to which the user will be
 * redirected after an authorization decision is obtained.
 *
 * This middleware simply initializes a new authorization transaction.  It is
 * the application's responsibility to authenticate the user and render a dialog
 * to obtain their approval (displaying details about the client requesting
 * authorization).  We accomplish that here by routing through `ensureLoggedIn()`
 * first, and rendering the `dialog` view.
 */
exports.authorization = [
    login.ensureLoggedIn(),
    server.authorization(function(clientID, redirectURI, scope, done) {
        db.clients.findByClientId(clientID, function(err, client) {
            if (err) {
                return done(err);
            }
            if (client.length !== 0) {
                client[0].scope = scope;
            }
            //WARNING: For security purposes, it is highly advisable to check that
            //          redirectURI provided by the client matches one registered with
            //          the server.  For simplicity, this example does not.  You have
            //          been warned.
            return done(null, client[0], redirectURI);
        });
    }),
    function(req, res, next) {
        //Render the decision dialog if the client isn't a trusted client
        //TODO Make a mechanism so that if this isn't a trusted client, the user can recorded that they have consented
        //but also make a mechanism so that if the user revokes access to any of the clients then they will have to
        //re-consent.
        db.clients.findByClientId(req.query.client_id, function(err, client) {
            if (!err && client[0] && client[0].trustedClient && client[0].trustedClient === true) {
                //This is how we short call the decision like the dialog below does
                server.decision({loadTransaction: false}, function(req, callback) {
                    callback(null, {allow: true});
                })(req, res, next);
            } else {
                res.render('dialog',
                    {transactionID: req.oauth2.transactionID, user: req.user, client: client[0]});
            }
        });
    }
];

/**
 * User decision endpoint
 *
 * `decision` middleware processes a user's decision to allow or deny access
 * requested by a client application.  Based on the grant type requested by the
 * client, the above grant middleware configured above will be invoked to send
 * a response.
 */
exports.decision = [
    login.ensureLoggedIn(),
    server.decision()
];

/**
 * Token endpoint
 *
 * `token` middleware handles client requests to exchange authorization grants
 * for access tokens.  Based on the grant type being exchanged, the above
 * exchange middleware will be invoked to handle the request.  Clients must
 * authenticate when making requests to this endpoint.
 */
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
    server.token(),
    server.errorHandler()
];

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTPS request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
    return done(null, client.id);
});

server.deserializeClient(function(id, done) {
    db.clients.find({id: id}, function(err, client) {
        if (err) {
            return done(err);
        }
        return done(null, client[0]);
    });
});

