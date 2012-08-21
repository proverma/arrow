/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

window.arrowInitStatus = "no";
window.arrowGetInitStatus = function() {
    return window.arrowInitStatus;
}

window.$.getScript("http://code.jquery.com/qunit/qunit-git.js", function() {
    window.arrowInitStatus = "yes";
    QUnit.init();
});
