/*jslint node: true */
/*global require */
'use strict';
var mongoose = require('mongoose');

/**
 * This is the configuration of the users that are allowed to connected to your authorization server.
 * These represent users of different client applications that can connect to the authorization server.
 * At a minimum you need the required properties of
 *
 * id: (A unique numeric id of your user )
 * username: (The user name of the user)
 * password: (The password of your user)
 * name: (The name of your user)
 */

var UserSchema = new mongoose.Schema({
    id: {type: String, required: true},
    displayName: {type: String, required: true},
    emails: [{
                value: {type: String}
             }]
});

var User = mongoose.model('User', UserSchema);

/**
 * Returns a user if it finds one, otherwise returns
 * null if a user is not found.
 * @param id The unique id of the user to find
 * @param done The function to call next
 * @returns The user if found, otherwise returns null
 */

exports.find = function(id, done){
    User.find({id: id}, done);
};

/**
 * Returns a user if it finds one, otherwise returns
 * null if a user is not found.
 * @param username The unique user name to find
 * @param done The function to call next
 * @returns The user if found, otherwise returns null
 */
exports.findByUsername = function(username, done) {
    User.find({username: username}, done);
};

exports.model = User;