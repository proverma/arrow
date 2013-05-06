/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('proxymanager-tests', function (Y, NAME) {

    //TODO - Stub portchecker

    var path = require('path'),
        http = require('http'),
        log4js = require("log4js"),
        logger = log4js.getLogger("ProxyManagerTests"),
        arrowRoot =  path.join(__dirname, '../../../../'),
        ProxyManager = require("../../../../lib/proxy/proxymanager.js"),
        portchecker = require("../../../../ext-lib/portchecker"),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        self = this;


    /**
     * If port is available, proxy server should be started
     */
    function testSendRequestToProxyServer() {

        //TODO - Not complete
        var
        // TODO - Check the first available port here starting from minPort
            minPort = 10801,
            maxPort = 10900,
            hostName = "localhost",
            routerJsonPath = __dirname + "/config/router.json",
            proxyManager = new ProxyManager(routerJsonPath),
            options,
            req;

        function createProxyServerRequest(minPort, maxPort, hostName, callback) {

            proxyManager.runRouterProxy(minPort, maxPort, hostName, function (proxyHostMsg) {

                A.areEqual(proxyHostMsg, 'localhost:' + minPort, 'Proxy host doesn\'t match');
                callback();

            });
        }

        A.areEqual(routerJsonPath, proxyManager.proxyConfig, 'Router jsonpath doesn\'t match');

        createProxyServerRequest(minPort, maxPort, hostName, function () {

            function onRequest(request, response) {

                response.writeHead(200, {"Content-Type" : "text/plain"});
                response.write("Hello world");
                response.end();

            }

            portchecker.getFirstAvailable(11000, 11100, "localhost", function (p) {

                http.createServer(onRequest).listen(p);

                options = {
                    host: hostName,
                    port: minPort,
                    path: '/',
                    method: 'GET'
                };

                req = http.request(options, function (res) {
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        console.log('BODY: ' + chunk);
                    });
                });

                req.on('error', function (e) {
                    console.log('problem with request: ' + e.message);
                });

                // write data to request body
                req.write('my data\n');
                req.end();

            });


        });


    }

    /*
     The router file's path is valid
     */
    function testRouterValidJsonPath() {

        var routerJsonPath = "./config/router.json",
            proxyManager = new ProxyManager(routerJsonPath);
        A.areEqual(routerJsonPath, proxyManager.proxyConfig, 'Router jsonpath doesn\'t match');
    }

    /*
     The router file's path is invalid
     */

    function testRouterInvalidJsonPath() {
        var routerJsonPath = ".invalidJson",
            proxyManager = new ProxyManager(routerJsonPath);
        A.areEqual(routerJsonPath, proxyManager.proxyConfig, 'Router jsonpath doesn\'t match');
    }

    /*
     The router file's path is null - i.e no file specified
     */

    function testNoJsonPath() {
        var proxyManager = new ProxyManager(null);
        A.isNull(proxyManager.proxyConfig, 'Router Json Path shall be null');
    }

    /**
     * If port is not available, proxy server cant be started
     */
    function testPortsNotAvailable() {

        var
            minPort = 10701,
            maxPort = 10800,
            hostName = "localhost",
            server,
            proxyManager = new ProxyManager(null);

        portchecker.getFirstAvailable(minPort, maxPort, hostName, function (p, host) {

            if (p === -1) {
                callback("Error : No free ports found for Proxy Server on " + host + " between " + minPort + " and " + maxPort);
            } else {

                minPort = p;
                maxPort = p;

                server = http.createServer(function (request, response) {

                }).listen(minPort, hostName, function () {

                    proxyManager.runRouterProxy(minPort, maxPort, hostName, function (proxyHostMsg) {

                        A.areEqual(proxyHostMsg, 'Error : No free ports found for Proxy Server on localhost between ' + minPort + ' and ' + maxPort);
                        server.close(function () {
                        });

                    });

                });
            }
        });

    }

    /**
     * If port is available, proxy server should be started
     */
    function testPortsAvailable(test) {

        var
            // TODO - Check the first available port here starting from minPort
            minPort = 10601,
            maxPort = 10700,
            hostName = "localhost",
            routerJsonPath = __dirname + "/config/router.json",
            proxyManager = new ProxyManager(routerJsonPath),
            availablePort;

        A.areEqual(routerJsonPath, proxyManager.proxyConfig, 'Router jsonpath doesn\'t match');

        proxyManager.runRouterProxy(minPort, maxPort, hostName, function (proxyHostMsg) {
            test.resume(function () {

                availablePort = proxyHostMsg.split(':');
                YUITest = Y.Test;
                A.areEqual(proxyHostMsg, 'localhost:' + availablePort[1], 'Proxy host doesn\'t match');
            });

            availablePort = proxyHostMsg.split(":");

        });

        test.wait(5000);

    }

    /**
     *
     */
    function testWriteLog() {

        var proxyManager = new ProxyManager(null),
            fs = require("fs"),
            proxyFileData,
            timestamp = new Date().getTime(),
            proxyLogfile = "proxy_" + timestamp + ".log",
            proxyMsg = "This is proxy log" + timestamp,
            data;

        proxyManager.fileName = proxyLogfile;

        proxyManager.writeLog(proxyMsg);

        data = fs.readFileSync(proxyManager.fileName, 'utf8');
        A.areEqual(proxyMsg + '\n', data, 'Proxy logs doesn\'t match - expected :' + proxyMsg + '\n' + ' , got this:' + data);
        fs.unlinkSync(proxyManager.fileName);

    }



    /**
     * Test get options
     */
    function testGetOptions() {

        var
            proxyManager = new ProxyManager("somejsonpath"),

            request = {
                'headers': { 'host': 'yahoo.com',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:16.0) Gecko/20100101 Firefox/16.0',
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'accept-language': 'en-US,en;q=0.5',
                    'accept-encoding': 'gzip, deflate',
                    'proxy-connection': 'keep-alive',
                    'referer': 'http://sports.yahoo.com/',
                    'cookie': 'B=9csi6n98gtaiv&b=3&s=rt'
                    },
                'url' : 'http://www.yahoo.com:4080/'
            },
            router = {
                "yahoo.com": {
                    "newHost": "def.yahoo.com",
                    "headers":
                        [
                            { "param": "user-agent",
                                "value": "Mozilla5.0"
                                },
                            { "param": "accept",
                                "value": "text/json"
                                },
                            { "param": "accept-language",
                                "value": "es-ES;q=0.5"
                                },
                            { "param": "accept-encoding",
                                    "value": "gzip, deflate"
                                },
                            { "param": "proxy-connection",
                                    "value": "keep-alive"
                                },
                            { "param": "referer",
                                    "value": "ref.yahoo.com"
                                },
                            { "param": "cookie",
                                    "value": "ProxyCookie"
                                }
                        ],
                    "record": true
                }
            },

            options = proxyManager.getOptions(router, request);

        A.areEqual(options.host, "def.yahoo.com", "Host doesnt match");
        A.areEqual(options.port, "4080", "Port doesnt match");
        A.areEqual(options.path, "http://www.def.yahoo.com:4080/", "Path doesnt match");
        A.areEqual(options.headers.host, "yahoo.com", "Headers host doesnt match");
        A.areEqual(options.headers["user-agent"], "Mozilla5.0", "Headers - user agent doesnt match");
        A.areEqual(options.headers.accept, "text/json", "Headers - accept doesnt match");
        A.areEqual(options.headers["accept-language"], "es-ES;q=0.5", "Headers - accept-language doesnt match");
        A.areEqual(options.headers["accept-encoding"], "gzip, deflate", "Headers - accept-encoding doesnt match");
        A.areEqual(options.headers["proxy-connection"], "keep-alive", "Headers - proxy-connection doesnt match");
        A.areEqual(options.headers.referer, "ref.yahoo.com", "Headers - referer doesnt match");
        A.areEqual(options.headers.cookie, "ProxyCookie", "Headers - cookie doesnt match");

    }


    suite.add(new Y.Test.Case({

        'setUp': function () {
           //logger.info('>>>setup Proxymanager tests');
        },

        'tearDown': function () {
            //logger.info('>>>teardown Proxymanager tests');
        },

        'test proxy manager No Ports Available': function () {
            testPortsNotAvailable();
        },

        'test proxy manager Send Request to Proxy Server': function () {
            testSendRequestToProxyServer();
        },

        'test proxy manager Ports Available': function () {
            var test = this;
            testPortsAvailable(test);
        },

        'test proxy manager No Json Path': function () {
            testNoJsonPath();
        },

        'test proxy manager valid Json Path': function () {
            testRouterValidJsonPath();
        },

        'test proxy manager invalid Json path': function () {
            testRouterInvalidJsonPath();
        },

        'test proxy manager writeLog': function () {
            testWriteLog();
        },

        'test proxy manager get options': function () {
            testGetOptions();
        }

    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: ['test']});

