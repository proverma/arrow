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
        injected_file_prefix,
        istanbul_bin = path.resolve(__dirname, "../../../node_modules/istanbul", 'lib', 'cli.js'),
        istanbul_exclude_pattern,
        istanbul_root;

    // hardcode the directory of child process coverage report, it has to match with glob in lib/session/sessionfactory.js
    coverage_dir = "child_process_coverage";
    injected_file_prefix = "temp-for-coverage-";

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
        setExcludePattern: function (pattern) {
            istanbul_exclude_pattern = pattern;
        },

        /**
         * Inject the header of mocking child_process to JS file
         * So that its child_process can also be instrumented and collected coverage, recursively.
         *
         * @param file the JS to be injected header
         *
         * @return injected file (path)
         */
        injectMockeryHeader: function (file) {
            var dirname = path.dirname(file),
                basename = path.basename(file),
                fs = require('fs'),
                new_file,
                orig_content,
                mocker_module,
                lines,
                header;

            new_file = path.resolve(dirname, injected_file_prefix + basename);
//
            header = "var mockery = require('mockery');\
                    var YUI = require('yui').YUI;\
                    var Y = YUI({ useSync: true, modules: { 'istanbul-command-runner': { fullpath: \"" + __filename + "\" } } }).use('istanbul-command-runner');\
                    var mock_child_process = { spawn: Y.IstanbulCommandRunner.spawn };\
                    Y.IstanbulCommandRunner.setIstanbulRoot('" + istanbul_root + "');\
                    Y.IstanbulCommandRunner.setExcludePattern('" + istanbul_exclude_pattern + "');\
                    mockery.registerMock('child_process', mock_child_process);\
                    mockery.enable({ useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false });";
//
//
            mocker_module = __dirname + "/mock-child-process.js"
            header = "var mockery = require('mockery');\
                    var path = require('path');\
                    var mocker = require('" + mocker_module + "');\
                    var mock_child_process = { spawn: mocker.spawn };\
                    mocker.set_istanbul_root('" + istanbul_root + "');\
                    mocker.set_exclude_pattern('" + istanbul_exclude_pattern + "');\
                    mockery.registerMock('child_process', mock_child_process);\
                    mockery.enable({ useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false });";
//
            orig_content = fs.readFileSync(file, 'utf8');

            //check if the first line is shebang interpreter directive
            lines = orig_content.split("\n");
            if (lines[0].indexOf("#!") === 0) {
                lines[0] += "\n" + header;
            } else {
                lines[0] = header + lines[0];
            }

            fs.writeFileSync(new_file, lines.join("\n"));

            return new_file;
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

            var cmd = 'node',
                realArgs = [
                    istanbul_bin,
                    'cover',
                    '--report=lcov',
                    '--root=' + istanbul_root,
                    '-x=' + istanbul_exclude_pattern,
                    '--dir=' + path.resolve(coverage_dir, process.pid + '.' + counter)
                ],
                self = this,
                injected_file,
                cp;

            // get the extra args for istanbul command
            options = options || {};

            if (verbose) {
                realArgs.push('-v');
            }

            injected_file = self.injectMockeryHeader(file);

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
        }
    };
}, "0.1", {
    requires: [""]
});
