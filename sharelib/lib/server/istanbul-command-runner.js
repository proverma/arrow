/*jslint nomen: true, node: true */
/*globals YUI*/
/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/**
 * YUI module wrapper of node module: mockchildprocess.js
 *
 * example:
 *
 * YUI.add("child-process-tests", function (Y) {
 *     var suite = new Y.Test.Suite("unit test suite");
 *     
 *     suite.add(new Y.Test.Case({
 *         "test command runner with istanbul instrument": function() {
 *             self = this;
 *             Y.IstanbulCommandRunner.setIstanbulRoot(__dirname + '/lib');
 *             var cp = Y.IstanbulCommandRunner.spawn(__dirname + '/app/child-app.js', ["--foo"]);
 *             cp.on('exit',function(code){
 *                 console.log('From parrent: sub exit with ' + code);
 *             });
 * 
 *             // If this test sessinon finished before above spawned child process exit, 
 *             // seems the child process would be ended, so, please give enough time to
 *             // wait here
 *             this.wait(function () {}, 2000);
 *         }
 *     }));
 * 
 *     //Note we are not "running" the suite. 
 *     //Arrow will take care of that. We simply need to "add" it to the runner
 *     Y.Test.Runner.add(suite);
 * }, "0.1", {requires:["test", "istanbul-command-runner"]});
 * 
 */
YUI.add("istanbul-command-runner", function (Y) {
    'use strict';

    var mocker = require('../../../lib/util/mockchildprocess');

    Y.IstanbulCommandRunner = {

        /**
         * Set the --root parameter for istanbul cover command
         * the parameter will pass down to nested mocked chld processes
         *
         * @param dir the root path to look for files to instrument by istanbul
         *
         */
        setIstanbulRoot: function (dir) {
            mocker.set_istanbul_root(dir);
        },

        /**
         * Set the -x parameter for istanbul cover command
         * the parameter will pass down to nested mocked chld processes
         *
         * @param pattern the exclude pattern for istanbul
         *
         */
        setExcludePattern: function (pattern) {
            mocker.set_exclude_pattern(pattern);
        },

        /**
         * mocked spawn, which call istanbul cover to generate code covearge
         *
         * @param file JS file to run
         * @param args Array list of string arguments pass to JS file command (not to istanbul command)
         * @param options options object pass to child_process.spawn
         *
         * @return ChildProcess object
         */
        spawn: function (file, args, options) {
            return mocker.spawn(file, args, options);
        }
    };
}, "0.1", {
    requires: [""]
});
