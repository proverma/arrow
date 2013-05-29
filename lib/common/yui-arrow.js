//TODO Figure out and add some good common methods for all arrow users
/*jslint forin:true sub:true undef: true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/
// Augment YUI with 
// - expressive asserts
// - selenium like query

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add("arrow", function (Y) {

}, "0.1", { requires: ["test"]});

/**
 this lib always get loaded before any yui tests and we disable Yui test runner 'run' method here
 to let arrow take control when to start run tests
 Also because yui test runner is a singleton ,so we can mock it here, all tests code use Y.test.runner.run will
 call empty function,while arrow test runner will call origin_run to really 'run' it.
 */
YUI().use('test', function (Y) {
    if (!Y.Test || !Y.Test.Runner || !Y.Test.Runner.run)return;
    if (!Y.Test.Runner.origin_run) {
        Y.Test.Runner.origin_run = Y.Test.Runner.run;
        Y.Test.Runner.run = function () {
        };
    }
});