/*jslint nomen: true, node: true, stupid: true */

/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/**
 * nodejs child_process istanbul mocker
 *
 * This is a mocker module for nodejs child_process, to run istanbul (https://github.com/gotwarlost/istanbul) 
 * to get code covearage on child process.
 * This module has to work with mockery (https://github.com/mfncooper/mockery) as below sample code.
 *
 *           var mockery = require('mockery');
 *           var mocker = require("/path/to/mock-child-process");
 *           var mocked_child_process = {
 *              spawn: mocker.spawn
 *           };
 *
 *           // set parameter of "--root" for istanbul command
 *           mocker.set_istanbul_root("../lib");
 *           // set "-x <exclude-pattern>" for istanbul command
 *           mocker.set_exclude_pattern("** /lib/temp*");
 *
 *           mockery.registerMock('child_process', mocked_child_process);
 *           mockery.enable({ useCleanCache: true });
 *
 *           var spawn = require("child_process").spawn;
 *           var cp = spawn("/path/to/app", args, options);
 *           cp.stdout.pipe(process.stdout, {end: false});
 *           cp.stderr.pipe(process.stderr, {end: false});
 *           cp.stdin.end();
 *           cp.on('exit',function(code){
 *               console.log('From parent: spawned child exit with code: ' + code);
 *           });
 *
 * @module mock-child-process
 *
 */

'use strict';

var util = require("util"),
    child_process = require("child_process"),
    verbose = true,
    counter = 0,
    path = require('path'),
    istanbul_module = require.resolve("istanbul"),
    istanbulFile = path.resolve(istanbul_module, '..', 'lib', 'cli.js'),
    exclude_pattern,
    coverage_dir,
    injected_file_prefix,
    istanbul_root;

// hardcode the directory of child process coverage report, it has to match with glob in lib/session/sessionfactory.js
coverage_dir = "child_process_coverage";

// prefix for file being injected header
injected_file_prefix = "temp-for-coverage-";

/**
 * Inject the header of mocking child_process to JS file
 * So that its child_process can also be instrumented and collected coverage, recursively.
 *
 * @private
 *
 * @param file the JS to be injected header
 *
 * @return injected file (path)
 */
function inject_mockery_header(file) {
    var dirname = path.dirname(file),
        basename = path.basename(file),
        fs = require('fs'),
        new_file,
        orig_content,
        mocker_module,
        lines,
        header;

    new_file = path.resolve(dirname, injected_file_prefix + basename);

    mocker_module = __dirname + "/" + path.basename(__filename);
    header = "var mockery = require('mockery');\
            var path = require('path');\
            var mocker = require('" + mocker_module + "');\
            var mock_child_process = { spawn: mocker.spawn };\
            mocker.set_istanbul_root('" + istanbul_root + "');\
            mocker.set_exclude_pattern('" + exclude_pattern + "');\
            mockery.registerMock('child_process', mock_child_process);\
            mockery.enable({ useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false });";

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
}

/**
 * Set the --root parameter for istanbul cover command
 * the parameter will pass down to nested mocked chld processes
 *
 * @private
 *
 * @param dir the root path to look for files to instrument by istanbul
 *
 */
var set_istanbul_root = exports.set_istanbul_root = function (dir) {
    istanbul_root = dir;
};

/**
 * Set the -x parameter for istanbul cover command
 * the parameter will pass down to nested mocked chld processes
 *
 * @private
 *
 * @param pattern the exclude pattern for istanbul
 *
 */
var set_exclude_pattern = exports.set_exclude_pattern = function (pattern) {
    exclude_pattern = pattern;
};

/**
 * mocked spawn, which call istanbul cover to generate code covearge
 *
 * @param file JS file to run
 * @param args Array list of string arguments pass to JS file command (not to istanbul command)
 * @params options options object pass to child_process.spawn
 *
 * @return ChildProcess object
 */
var spawn = exports.spawn = function (file, args, options) {
    counter += 1;
    var cmd = '/home/y/bin/node',
        realArgs = [
            istanbulFile,
            'cover',
            '--report=lcov',
            '--root=' + istanbul_root,
            '-x=' + exclude_pattern,
            '--dir=' + path.resolve(coverage_dir, process.pid + '.' + counter)
        ],
        injected_file,
        cp;

    // get the extra args for istanbul command
    options = options || {};

    if (verbose) {
        realArgs.push('-v');
    }

    injected_file = inject_mockery_header(file);

    realArgs.push(injected_file);

    // get the extra args for JS file 
    if (args) {
        realArgs.push('--');
        realArgs.push.apply(realArgs, args);
    }

    if (verbose) {
        console.log('Run:' + cmd + ' ' + realArgs.join(' '));
    }
    cp = child_process.spawn(cmd, realArgs, options);
    return cp;
};

