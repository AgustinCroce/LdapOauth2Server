/*jslint node: true */
/*global require */
/*global module */
'use strict';

/**
 * This is the configuration of the clients that are allowed to connected to your authorization server.
 * These represent client applications that can connect.  At a minimum you need the required properties of
 *
 * id: (A unique numeric id of your client application )
 * name: (The name of your client application)
 * clientId: (A unique id of your client application)
 * clientSecret: (A unique password(ish) secret that is _best not_ shared with anyone but your client
 *     application and the authorization server.
 *
 * Optionally you can set these properties which are
 * trustedClient: (default if missing is false.  If this is set to true then the client is regarded as a
 *     trusted client and not a 3rd party application.  That means that the user will not be presented with
 *     a decision dialog with the trusted application and that the trusted application gets full scope access
 *     without the user having to make a decision to allow or disallow the scope access.
 */
var mongoose = require('mongoose');

var ClientSchema = new mongoose.Schema({
    id           : {type: String, required: true},
    name         : {type: String, required: true},
    clientId     : {type: String, required: true},
    clientSecret : {type: String, required: true},
    trustedClient: {type: Boolean}
});

/**
 * Returns a client if it finds one, otherwise returns
 * null if a client is not found.
 * @param id The unique id of the client to find
 * @param done The function to call next
 * @returns The client if found, otherwise returns null
*/
//ClientSchema.statics.find = function find(id, done) {
//    return this.find({id: id}, done);
//};

/**
 * Returns a client if it finds one, otherwise returns
 * null if a client is not found.
 * @param clientId The unique client id of the client to find
 * @param done The function to call next
 * @returns The client if found, otherwise returns null
 */
ClientSchema.statics.findByClientId = function(clientId, done) {
    return this.find({clientId: clientId}, done);
};

module.exports = mongoose.model('Client', ClientSchema);