/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add("media-greeter", function (Y) {
    Y.namespace("Media");

    var Greeter = Y.Media.Greeter = function() {};
    
    //This is a simple method which takes two params, first and last name
    //It returns it as lastname, firstname
    Greeter.prototype.greet = function(firstName, lastName) {
        return lastName + ", " + firstName;
    }
}, "0.1", {requires:[]});
