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
            arrowRoot = path.join(__dirname, '../../../../'),
            FileUtil = require("../../../../lib/util/fileUtil.js"),
            ProxyManager = require("../../../../lib/proxy/proxymanager.js"),
            portchecker = require("../../../../ext-lib/portchecker"),
            localhostip = require('../../../../arrow_server/arrowservermanager').getLocalhostIPAddress(),
            suite = new Y.Test.Suite(NAME),
            A = Y.Assert,
            self = this,
            fileUtil = new FileUtil();


        function getProxyFileName() {
            var hrTime = process.hrtime();
            var proxyFileName = "proxy_";
            proxyFileName += (hrTime[0] * 1000 + hrTime[1] / 1000);
            proxyFileName += ".log";
            return proxyFileName;
        }

        /**
         * If port is available, proxy server should be started
         */
        function testSendRequestToProxyServer() {

            //TODO - Not complete
            var
            // TODO - Check the first available port here starting from minPort
                minPort = 10811,
                maxPort = 10900,
                hostName = "localhost",
                routerJsonPath = __dirname + "/config/router.json",
                proxyFile,
                fs = require('fs');

            proxyFile = getProxyFileName();

            var  proxyManager = new ProxyManager(routerJsonPath, {}, proxyFile),
                options,
                req;

            function createProxyServerRequest(minPort, maxPort, hostName, callback) {

                proxyManager.runRouterProxy(minPort, maxPort, hostName, function (proxyHostMsg) {

                    A.areNotEqual(proxyHostMsg, 'localhost:' + minPort, 'Proxy host should not match');
                    A.areEqual(proxyHostMsg, localhostip + ':' + minPort, 'Proxy host doesn\'t match');
                    callback();

                });
            }

            A.areEqual(routerJsonPath, proxyManager.proxyConfig, 'Router jsonpath doesn\'t match');

            createProxyServerRequest(minPort, maxPort, hostName, function () {

                function onRequest(request, response) {

                    response.writeHead(200, {"Content-Type": "text/plain"});
                    response.write("Hello world");
                    response.end();
                    fileUtil.deleteFile(proxyFile,function(){

                    });

                }

                portchecker.getFirstAvailable(11100, 11200, "localhost", function (p) {

//                    http.createServer(onRequest).listen(p);

                    options = {
                        host: localhostip,
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

        /**
         * If port is available, proxy server should be started
         */
        function testClientSideInstrumentOnProxyServer() {

            var proxyFile = getProxyFileName();

            // TODO - Check the first available port here starting from minPort
            var minPort = 10901,
                maxPort = 11000,
                hostName = "localhost",
                routerJsonPath = __dirname + "/config/router.json",
                proxyManager = new ProxyManager(routerJsonPath, {}, proxyFile),
                options,
                req;

            global.currentSessionid = global.currentSessionid || '12345';

            function createProxyServerRequest(minPort, maxPort, hostName, callback) {

                proxyManager.runRouterProxy(minPort, maxPort, hostName, function (proxyHostMsg) {

                    console.log("in test client side instrument,proxy started corrently");
                    A.areNotEqual(proxyHostMsg, 'localhost:' + minPort, 'Proxy host should not match');
                    A.areEqual(proxyHostMsg, localhostip + ':' + minPort, 'Proxy host doesn\'t match');
                    callback();

                });
            }

            createProxyServerRequest(minPort, maxPort, hostName, function () {


                options = {
                    host: hostName,
                    port: minPort,
                    path: '/proxyCoverage?sid=12345',
                    method: 'GET'
                };

                function sentToCoverage(method, data) {
                    options.method = method;
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
                    req.write(data);
                    req.end();
                }

                sentToCoverage("GET", "\n");
                sentToCoverage("OPTIONS", "\n");
                sentToCoverage("POST", "\n"); // should be catch
                sentToCoverage("POST", JSON.stringify({coverage: {}, sid: "12345", origin: "nourl"}) + "\n");
                sentToCoverage("GET", "\n"); // get again

                setTimeout(function () {
                    proxyManager.proxyServer.close();
                    fileUtil.deleteFile(proxyFile,function(){

                    });

                }, 2000);
            });


        }

        // test proxy http client
        function testHttpClientOnProxyServer(test) {

            var proxyFile = getProxyFileName();

            // TODO - Check the first available port here starting from minPort
            var minPort = 11101,
                maxPort = 11199,
                hostName = "localhost",
                router = {},
                proxyManager = new ProxyManager(router, {}, proxyFile),
                options,
                req,
                server;

            // test instrument

            function onRequest(request, response) {
                var url = require('url');
                if (url.parse(request.url).pathname == '/index.html') {
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.write("<head></head><body></body>");

                } else if (url.parse(request.url).pathname == '/index.js') {
                    response.writeHead(200, {"Content-Type": "text/javascript"});
                    response.write("var a=1;\n");

                } else if (url.parse(request.url).pathname == '/index2.js') {
                    response.writeHead(200, {"Content-Type": "text/javascript", "content-encoding": "gzip"});
                    response.write("\n");

                } else if (url.parse(request.url).pathname == '/index3.js') {
                    response.writeHead(200, {"Content-Type": "text/javascript", "content-encoding": "deflate"});
                    response.write("\n");

                } else if (url.parse(request.url).pathname == '/index.jpeg') {
                    response.writeHead(200, {"Content-Type": "image/jpeg"});
                    response.write("abcde\n");
                } else {
                    response.writeHead(200, {"Content-Type": "text/plain"});
                    response.write("Hello js\n");

                }
                response.end();
            }

            portchecker.getFirstAvailable(11300, 11399, "localhost", function (p) {

                    console.log("in test http client,tmp server will start at:" + p);

                    server = http.createServer(onRequest).listen(p);

                    console.log("in test http client,tmp server started correctly");

                    proxyManager.proxyConfig = {
                        "localhost": {
                            "newHost": hostName + ":" + p,
                            "headers": [
                                { "param": "user-agent",
                                    "value": "Mozilla5.0"
                                }
                            ],
                            "record": true
                        },
                        "coverage": {
                            "clientSideCoverage": true,
                            "coverageExclude": ["^http://yui.yahooapis.com.*\\.js$"]
                        }
                    };
                    console.log("in test http client,proxy server config");
                    console.log(JSON.stringify(proxyManager.proxyConfig));

                    proxyManager.runRouterProxy(minPort, maxPort, hostName, function (proxyHostMsg) {

                        console.log("in test http client , proxy will started correctly");

                        A.areNotEqual(proxyHostMsg, 'localhost:' + minPort, 'Proxy host should not match');
                        A.areEqual(proxyHostMsg, localhostip + ':' + minPort, 'Proxy host doesn\'t match');

                        options = {
                            host: hostName,
                            port: minPort,
                            method: 'GET'
                        };
                        var body = '';

                        function sentToTmpServer(path, data) {
                            options.path = path;
                            req = http.request(options, function (res) {
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    body += chunk;
                                    console.log('BODY: ' + chunk);
                                });
                            });

                            req.on('error', function (e) {
                                console.log('problem with request: ' + e.message);
                            });

                            // write data to request body
                            req.write(data);
                            req.end();
                        }

                        sentToTmpServer('/index.html', "\n");
                        sentToTmpServer('/index.js', "\n");
                        sentToTmpServer('/index2.js', "\n");
                        sentToTmpServer('/index3.js', "\n");
                        sentToTmpServer('/index.jpeg', "\n");

                    });
                    setTimeout(function () {
                        server.close();
                        proxyManager.proxyServer.close();
                        fileUtil.deleteFile(proxyFile,function(){

                        });

                    }, 2000);
                }
            )
            ;

        }

        /*
         The router file's path is valid
         */
        function testRouterValidJsonPath() {
            var proxyFile = getProxyFileName();
            var routerJsonPath = "./config/router.json",
                proxyManager = new ProxyManager(routerJsonPath, {}, proxyFile);
            A.areEqual(routerJsonPath, proxyManager.proxyConfig, 'Router jsonpath doesn\'t match');
            fileUtil.deleteFile(proxyFile,function(){

            });

        }

        /*
         The router file's path is invalid
         */

        function testRouterInvalidJsonPath() {

            var proxyFile = getProxyFileName();
            var routerJsonPath = ".invalidJson",
                proxyManager = new ProxyManager(routerJsonPath, {}, proxyFile);
            A.areEqual(routerJsonPath, proxyManager.proxyConfig, 'Router jsonpath doesn\'t match');

            fileUtil.deleteFile(proxyFile,function(){

            });

        }

        /*
         The router file's path is null - i.e no file specified
         */

        function testNoJsonPath() {
            var proxyFile = getProxyFileName();

            var proxyManager = new ProxyManager(null, {}, proxyFile);
            A.isNotNull(proxyManager.proxyConfig, 'Router Json Path shall be null');
            fileUtil.deleteFile(proxyFile,function(){

            });

        }

        /**
         * If port is not available, proxy server cant be started
         */
        function testPortsNotAvailable(test) {

            var proxyFile = getProxyFileName();

            var
                minPort = 10701,
                maxPort = 10800,
                hostName = "localhost",
                server,
                proxyManager = new ProxyManager(null, {}, proxyFile);

            portchecker.getFirstAvailable(minPort, maxPort, hostName, function (p, host) {

                if (p === -1) {
                    callback("Error : No free ports found for Proxy Server on " + host + " between " + minPort + " and " + maxPort);
                } else {

                    minPort = p;
                    maxPort = p;

                    server = http.createServer(function (request, response) {

                    }).listen(minPort, hostName, function () {
                            test.resume(function () {
                                proxyManager.runRouterProxy(minPort, maxPort, hostName, function (proxyHostMsg) {

                                    test.resume(function () {
                                        A.areEqual(proxyHostMsg, 'Error : No free ports found for Proxy Server on ' + localhostip + ' between ' + minPort + ' and ' + maxPort);

                                        server.close(function () {
                                        });
                                        fileUtil.deleteFile(proxyFile,function(){

                                        });
                                    });

                                });
                                test.wait(3000);
                            });

                        });
                }
            });
            test.wait(8000);

        }

        /**
         * If port is available, proxy server should be started
         */
        function testPortsAvailable(test) {

            var proxyFile = getProxyFileName();

            var
            // TODO - Check the first available port here starting from minPort
                minPort = 10601,
                maxPort = 10700,
                hostName = "localhost",
                routerJsonPath = __dirname + "/config/router.json",
                proxyManager = new ProxyManager(routerJsonPath, {}, proxyFile),
                availablePort;

            A.areEqual(routerJsonPath, proxyManager.proxyConfig, 'Router jsonpath doesn\'t match');

            console.log("in test ports available:start");
            proxyManager.runRouterProxy(minPort, maxPort, hostName, function (proxyHostMsg) {
                test.resume(function () {

                    console.log("in test ports available:started at " + proxyHostMsg);
                    availablePort = proxyHostMsg.split(':');
                    YUITest = Y.Test;
                    A.areEqual(proxyHostMsg, localhostip + ':' + availablePort[1], 'Proxy host doesn\'t match');
                    fileUtil.deleteFile(proxyFile,function(){

                    });

                });

            });

            test.wait(5000);

        }

        /**
         *
         */
        function testWriteLog() {

            var fs = require("fs"),
                proxyFile = getProxyFileName(),
                timestamp = new Date().getTime();

            try {

                fs.openSync(proxyFile, "w");

                var proxyManager = new ProxyManager(null, {}, proxyFile),
                    proxyMsg = "This is proxy log" + timestamp,
                    data;

                proxyManager.writeLog(proxyMsg);

                data = fs.readFileSync(proxyFile, 'utf8');

                A.isNotNull(data,"Failed to read from proxy log file");
                console.log('data:' + data);

                A.areEqual(proxyMsg + '\n', data, "Proxy log doesnt match");
                fileUtil.deleteFile(proxyFile,function(){
                });

            }
            catch(e) {
                self.logger.error('Error in creating stream for proxy log');
            }

        }

        /**
         * Test get options
         */
        function testGetOptions() {
            var proxyFile = getProxyFileName();

            var
                proxyManager = new ProxyManager(__dirname + "/config/router.json", {"coverage": true}, proxyFile),

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
                    'url': 'http://www.yahoo.com:4080/'
                },
                router = {
                    "yahoo.com": {
                        "newHost": "def.yahoo.com",
                        "headers": [
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
                    },
                    "coverage": {
                        "clientSideCoverage": true,
                        "coverageExclude": []
                    }
                },

                options = proxyManager.getOptions(router, request);

            A.areEqual(options.host, "def.yahoo.com", "Host doesnt match");
            A.areEqual(options.port, "4080", "Port doesnt match");
            A.areEqual(options.path, "/", "Path doesnt match");
            A.areEqual(options.headers.host, "yahoo.com", "Headers host doesnt match");
            A.areEqual(options.headers["user-agent"], "Mozilla5.0", "Headers - user agent doesnt match");
            A.areEqual(options.headers.accept, "text/json", "Headers - accept doesnt match");
            A.areEqual(options.headers["accept-language"], "es-ES;q=0.5", "Headers - accept-language doesnt match");
            A.areEqual(options.headers["accept-encoding"], "gzip, deflate", "Headers - accept-encoding doesnt match");
            A.areEqual(options.headers["proxy-connection"], "keep-alive", "Headers - proxy-connection doesnt match");
            A.areEqual(options.headers.referer, "ref.yahoo.com", "Headers - referer doesnt match");
            A.areEqual(options.headers.cookie, "ProxyCookie", "Headers - cookie doesnt match");
            fileUtil.deleteFile(proxyFile,function(){

            });


        }


        suite.add(new Y.Test.Case({

            'setUp': function () {
                //logger.info('>>>setup Proxymanager tests');
            },

            'tearDown': function () {

            },


            'test proxy manager No Ports Available': function () {
                testPortsNotAvailable(this);
            },

            'ignore:test proxy manager Send Request to Proxy Server': function () {
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
            },

            'test proxy manager instruement ': function () {
                var test = this;
                testClientSideInstrumentOnProxyServer(test);
            },

            'test proxy manager client request ': function () {
                var test = this;
                testHttpClientOnProxyServer(test);
            }

        }));

        Y.Test.Runner.add(suite);
    },
    '0.0.1', {requires: ['test']}
)
;

