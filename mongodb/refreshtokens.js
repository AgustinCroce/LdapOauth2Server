/*jslint node: true */
/* global  require*/
/* global  module*/
'use strict';

//The refresh tokens.
//You will use these to get access tokens to access your end point data through the means outlined
//in the RFC The OAuth 2.0 Authorization Framework: Bearer Token Usage
//(http://tools.ietf.org/html/rfc6750)

var mongoose = require('mongoose');

var RefreshTokenSchema = new mongoose.Schema({
    token   : {type: String, required: true},
    userID  : {type: String, required: true},
    clientID: {type: String, required: true},
    scope   : {type: String, required: true}
});

/**
 * Returns a refresh token if it finds one, otherwise returns
 * null if one is not found.
 * @param token The key to the refresh token
 * @param done The function to call next
 * @returns The refresh token if found, otherwise returns null
 */
RefreshTokenSchema.statics.find = function(token, done) {
    return this.find({token: token}, done);
};

/**
 * Deletes a refresh token
 * @param token The refresh token to delete
 * @param done returns this when done
 */
RefreshTokenSchema.statics.remove = function(token, done) {
    return this.remove({token: token}, done);
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);