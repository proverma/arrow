/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

var child_process = require('child_process'),
    portchecker = require('../../ext-lib/portchecker'),
    child,
    log4js = require("log4js"),
    phantomJsLogger = new log4js.getLogger("arrowServerManager"),
    PhantomJsSetup = module.exports = {};

PhantomJsSetup.waitForPhantomJs = function(childProcess, time, port, cb) {

    var tid,
        maxTries = 50,
        serverStarted = false,
        out,
        index,
        self = this,
        phantomJsStartMsg;

    phantomJsStartMsg = 'GhostDriver - Main - running on port ' + port;

    tid = setInterval(function () {

        if (maxTries === 0) {
            phantomJsLogger.info('Max Tries Over to start phantomJs..');
            clearInterval(tid);
            cb(false);
        }
        maxTries -= 1;

    }, time);

    out = '';

    childProcess.stdout.on('data', function(stdout) {

        out = out + stdout;
        // No need to callback again ,if server has already started
        if (!serverStarted) {

            index = out.indexOf(phantomJsStartMsg);
            if (index !== -1) {
                phantomJsLogger.info("PhantomJs Server started successfully");
                clearInterval(tid);
                serverStarted = true;
                cb(true);
            }
        }

    });

    childProcess.stderr.on('data', function(stderr) {
        phantomJsLogger.debug('Error while starting phantomjs:' + stderr);
    });


};

PhantomJsSetup.startPhantomJs = function (cb) {

    var
        self = this,
        minPort = 10000,
        maxPort = 11000,
        childProcess = require("child_process"),
        args = [];

    try {

        portchecker.getFirstAvailable(minPort, maxPort, "localhost", function (p, host) {
            if (p === -1) {
                phantomJsLogger.debug('No free ports found for arrow server on ' + host + ' between ' + minPort + ' and ' + maxPort);
            } else {
                phantomJsLogger.debug('The first free port found for arrow server on ' + host + ' between ' + minPort + ' and ' + maxPort + ' is ' + p);
                args.push('--webdriver=' + p);
                child = childProcess.spawn('phantomjs', args, {});

                self.waitForPhantomJs(child, 200, p, function(running) {

                    if (running === true) {
                        phantomJsLogger.info('PhantomJS up and running on :http://localhost:' + p + '/wd/hub');
                    } else {
                        phantomJsLogger.info('Error !! PhantomJS could not start..');
                    }
                    cb(running);
                });
            }
        });

    } catch (e) {
        phantomJsLogger.debug('Exception in starting phantomjs :' + e);
    }
};

/**
 * stop phantomjs
 */
PhantomJsSetup.stopPhantomJs = function () {

    if (child) {
        child.kill();
        phantomJsLogger.info("PhantomJs stopped");
    }
};


module.exports = PhantomJsSetup;