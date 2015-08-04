/*jslint node: true */
/*global exports */
'use strict';

var passport = require('passport');

exports.loginForm = function (req, res) {
    res.render('login');
};

exports.login = [
    passport.authenticate('WindowsAuthentication', {successReturnToOrRedirect: '/', failureRedirect: '/login'})
];

exports.logout = function (req, res) {
    req.logout();
    res.redirect('/');
};