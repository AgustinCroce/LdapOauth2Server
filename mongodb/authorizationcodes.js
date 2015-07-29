/*jslint node: true */
/*global module */
/*global require */
'use strict';

//The authorization codes.
//You will use these to get the access codes to get to the data in your endpoints as outlined
//in the RFC The OAuth 2.0 Authorization Framework: Bearer Token Usage
//(http://tools.ietf.org/html/rfc6750)
var mongoose = require('mongoose');

var AuthorizationCodeSchema = new mongoose.Schema({
    code       : {type: String, required: true},
    clientID   : {type: String, required: true},
    redirectURI: {type: String, required: true},
    userID     : {type: String, required: true},
    scope      : {type: String, required: true}
});

/**
 * Returns an authorization code if it finds one, otherwise returns
 * null if one is not found.
 * @param code The key to the authorization code
 * @param done The function to call next
 * @returns The authorization code if found, otherwise returns null
 */
AuthorizationCodeSchema.statics.find = function(code, done) {
    return this.find({code: code}, done);
};

/**
 * Deletes an authorization code
 * @param code The authorization code to delete
 * @param done Calls this with null always
 */
AuthorizationCodeSchema.statics.remove = function(code, done) {
    return this.remove({code: code}, done);
};

module.exports = mongoose.model('AuthorizationCode', AuthorizationCodeSchema);