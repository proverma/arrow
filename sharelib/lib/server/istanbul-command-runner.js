/*jslint nomen: true, node: true */
/*globals YUI*/
/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add("istanbul-command-runner", function (Y) {
    'use strict';

    var verbose = true,
        counter = 0,
        path = require('path'),
        coverage_dir,
        istanbul_bin = path.resolve(__dirname, "../../../node_modules/istanbul", 'lib', 'cli.js'),
        istanbul_exclude_pattern,
        istanbul_root;

    // hardcode the directory of child process coverage report, it has to match with glob in lib/session/sessionfactory.js
    coverage_dir = "child_process_coverage";

    Y.IstanbulCommandRunner = {

        setVerbose: function (flag) {
            verbose = typeof flag === 'undefined' ? true : !!flag;
        },

        /**
         * Set the --root parameter for istanbul cover command
         * the parameter will pass down to nested mocked chld processes
         *
         * @param dir the root path to look for files to instrument by istanbul
         *
         */
        setIstanbulRoot: function (dir) {
            istanbul_root = dir;
        },

        /**
         * Set the -x parameter for istanbul cover command
         * the parameter will pass down to nested mocked chld processes
         *
         * @param pattern the exclude pattern for istanbul
         *
         */
        set_exclude_pattern: function (pattern) {
            istanbul_exclude_pattern = pattern;
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
            counter += 1;

            var cmd = '/home/y/bin/node',
                realArgs = [
                    istanbul_bin,
                    'cover',
                    '--report=lcov',
                    '--root=' + istanbul_root,
                    '-x=' + istanbul_exclude_pattern,
                    '--dir=' + path.resolve(coverage_dir, process.pid + '.' + counter)
                ],
                injected_file,
                cp;

            // get the extra args for istanbul command
            options = options || {};

            if (verbose) {
                realArgs.push('-v');
            }

            //injected_file = inject_mockery_header(file);
            injected_file = file;

            realArgs.push(injected_file);

            // get the extra args for JS file 
            if (args) {
                realArgs.push('--');
                realArgs.push.apply(realArgs, args);
            }

            if (verbose) {
                console.log('Run:' + cmd + ' ' + realArgs.join(' '));
            }
            cp = require('child_process').spawn(cmd, realArgs, options);
            return cp;
        },

        /**
         * run the istanbul cover command, passing it the real command to run
         *
         * @method runCommand 
         *
         * @param {String} jsFile: the path of JS file to be runned in a spawned child process
         * @param {Array} iargs: the extra arguments pass to istanbul cover command
         * @param {Array} args: the arguments pass to JS file execution 
         * @param {Object} opts: the options pass to child_process.spawn
         *
         * @return spawned ChildProcess object
         */
        runCommand: function (jsFile, iargs, args, opts) {
            counter += 1;
            var cmd = '/home/y/bin/node',
                realArgs = [
                    istanbul_bin,
                    'cover',
                    '--report=lcov',
                    '--dir=' + path.resolve(coverage_dir, 'c' + counter)
                ],
                cp;

            // get the extra args for istanbul command
            realArgs.push.apply(realArgs, iargs);
            opts = opts || {};

            if (verbose) {
                realArgs.push('-v');
            }
            realArgs.push(jsFile);

            // get the extra args for JS file 
            if (args) {
                realArgs.push('--');
                realArgs.push.apply(realArgs, args);
            }

            if (verbose) {
                console.log('Run:' + cmd + ' ' + realArgs.join(' '));
            }
            cp = spawn(cmd, realArgs, opts);
            return cp;
        }
    };
}, "0.1", {
    requires: ["test"]
});
