/*jslint node: true */
/*global require */
/*global module */
'use strict';

//The access tokens.
//You will use these to access your end point data through the means outlined
//in the RFC The OAuth 2.0 Authorization Framework: Bearer Token Usage
//(http://tools.ietf.org/html/rfc6750)
var mongoose = require('mongoose');

var AccessTokenSchema = new mongoose.Schema({
    token         : {type: String, required: true},
    userID        : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    expirationDate: {type: Date, required: true},
    clientID      : {type: String, required: true},
    scope         : {type: String, required: true}
});

/**
 * If a callback is given it find the access token and execute the callback.
 * If a callback isn't given it returns a query object.
 * @param token The key to the access token
 * @param cb The function to call next
 * @returns The query if isn't given a callback, null otherwise
 */
AccessTokenSchema.statics.findByToken = function findByToken(token, cb) {
    return this.find({token: token}, cb);
};

/**
 * Removes expired access tokens.
 * @param done callback that will be executed once the access tokens are removed.
 * @returns done
 */
AccessTokenSchema.statics.removeExpired = function(done) {
    return this
        .where('expirationDate').lt(new Date())
        .remove(done);
};

/**
 * Removes all access tokens.
 * @param done returns this when done.
 */
AccessTokenSchema.statics.removeAll = function(done) {
    return this.remove({}, done);
};

module.exports = mongoose.model('AccessToken', AccessTokenSchema);