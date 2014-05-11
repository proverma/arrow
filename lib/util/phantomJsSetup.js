/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

var child_process = require('child_process'),
    portchecker = require('../../ext-lib/portchecker'),
    child,
    phantomHost,
    log4js = require("log4js"),
    phantomJsLogger = new log4js.getLogger("PhantomJsSetupLogger"),
    http = require("http"),
    self;

var PhantomJsSetup = (function() {

    var instance;

    function init () {

        instance = new Object();

        instance.waitForPhantomJs = function(childProcess, time, port, cb) {

            var tid,
                maxTries = 50,
                serverStarted = false,
                out,
                index,
                phantomJsStartMsg;

            //  PhantomJs 1.9 :  GhostDriver - Main - running on port , PhantomJs 1.8 : Ghost Driver running on port
            phantomJsStartMsg = 'running on port ' + port;

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
                phantomJsLogger.error('Error while starting phantomjs:' + stderr);
            });


        };

        instance.startPhantomJs = function (ignoreSslErrorsPhantomJs, cb) {
            var
                self = PhantomJsSetup.getInstance(),
                minPort = 10000,
                maxPort = 11000,
                childProcess = require("child_process"),
                args = [],
                retryTime = 400;

            if (!ignoreSslErrorsPhantomJs) {
                ignoreSslErrorsPhantomJs = false;
            }

            try {

                portchecker.getFirstAvailable(minPort, maxPort, "localhost", function (p, host) {
                    if (p === -1) {
                        phantomJsLogger.debug('No free ports found for arrow server on ' + host + ' between ' + minPort + ' and ' + maxPort);
                    } else {
                        phantomJsLogger.debug('The first free port found for arrow server on ' + host + ' between ' + minPort + ' and ' + maxPort + ' is ' + p);
                        args.push('--webdriver=' + p);
                        args.push('--ignore-ssl-errors=' + ignoreSslErrorsPhantomJs);
                        phantomJsLogger.debug('PhantomJs starting with arguments -' + args);
                        child = childProcess.spawn('phantomjs', args, {});

                        self.waitForPhantomJs(child, retryTime, p, function(running) {

                            if (running === true) {
                                phantomHost = 'http://localhost:' + p  + "/wd/hub";
                                phantomJsLogger.info('PhantomJS up and running on ' + phantomHost);
                            } else {
                                phantomJsLogger.info('Error !! PhantomJS could not start..');
                            }
                            cb(phantomHost);
                        });
                    }
                });

            } catch (e) {
                phantomJsLogger.error('Exception in starting phantomjs :' + e);
            }
        };

        instance.stopPhantomJs = function () {
            if (child) {
                child.kill();
                phantomJsLogger.info("PhantomJs stopped");
            }
        };

        instance.isPhantomJsRunning = function (cb) {

            if (phantomHost) {
                var phantomUrl = phantomHost + "/sessions";
                phantomJsLogger.debug("PhantomHost::" + phantomUrl);

                http.get(phantomUrl, function(response){
                    phantomJsLogger.debug('Status code :' + response.statusCode);
                    if (response.statusCode === 200) {
                        phantomJsLogger.debug('PhantomJs is running');
                        cb(true);
                    } else {
                        phantomJsLogger.debug('PhantomJs is NOT running');
                        cb(false);
                    }
                    return;
                }).on('error', function(e){
                        phantomJsLogger.error('Got error on HTTP get for the phantomjs url - ' + phantomUrl + ' : ' + e.message);
                        cb(false);
                    })
            } else {
                phantomJsLogger.debug('phantomHost is NOT set');
                cb(false);
            }

        };

    };

    return {

        getInstance: function() {
            if (!instance) {
                init();
            }

            return instance;
        }

    }

})();

module.exports = PhantomJsSetup;