/*jslint nomen: true */

"use strict";

function foo() {
    console.log("\nThis is foo...");

    var spawn = require("child_process").spawn;
    var cp = spawn("./app/child-app.js", ["--bar"]);
    cp.stdout.pipe(process.stdout, {end: false});
    cp.stderr.pipe(process.stderr, {end: false});
    cp.stdin.end();
}

function bar() {
    console.log("\nThis is bar...");

    var spawn = require("child_process").spawn;
    var cp = spawn("./app/child-app.js", ["--baz"]);
    cp.stdout.pipe(process.stdout, {end: false});
    cp.stderr.pipe(process.stderr, {end: false});
    cp.stdin.end();
}

function baz() {
    console.log("\nThis is baz...");
}

function qux() {
    console.log("\nThis is qux...");

    process.on('message', function(m) {
        console.log('In qux: got message:', m);
        process.exit(0);
    });
}

module.exports = {
    foo: foo,
    bar: bar,
    baz: baz,
    qux: qux
}

