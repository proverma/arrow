#!/usr/bin/env node

/*jslint forin:true sub:true anon:true sloppy:true stupid:true nomen:true node:true continue:true*/

var childProcess = require("child_process");
var fs = require("fs");
var ghostPort = process.argv[2];
var arrowHost = process.argv[3];

//console.log(ghostPort + ":" + arrowHost );

process.chdir(__dirname + "/../ghostdriver/src");
var child = childProcess.spawn("phantomjs", ["main.js", ghostPort]);
var initPhantom = false;

child.stdout.on("data", function (data) {
    var pjUrl;
    console.log(data.toString());
    if (!initPhantom) {
        //console.log("Writing arrow_phantom_server.status");
        pjUrl = "http://" + arrowHost + ":" + ghostPort;
        fs.writeFileSync("/tmp/arrow_phantom_server.status", pjUrl);
        initPhantom = true;
    }
});

child.stderr.on("data", function (data) {
    console.error(data.toString());
});