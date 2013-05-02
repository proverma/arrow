/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var http = require('http'),
    log4js = require("log4js"),
    fs = require('fs'),
    path = require('path'),
    portchecker = require("../../ext-lib/portchecker"),
    url = require('url');

var querystring = require('querystring');
var os = require('os');
var url2path = require('url2path');
var mkdirp = require('mkdirp');
var istanbul = require('istanbul');
var util = require('util'),
    colors = require('colors');

var Instrumenter = istanbul.Instrumenter;
var Collector = istanbul.Collector;
var Report = istanbul.Report;
var Store = istanbul.Store;


function ProxyManager(routerConfig, config) {
    this.config = config;
    this.routerJsonPath = routerConfig;
    this.logger = log4js.getLogger("ProxyManager");
    if (global.workingDirectory) {
        this.fileName = path.resolve(global.workingDirectory, "proxy.log");
    } else {
        this.fileName = "proxy.log";
    }
    this.record = [];
}

/**
 *
 * @param router - proxy configuration defined in json file
 * @param request - request
 * @return {Object} - Options
 */
ProxyManager.prototype.getOptions = function (router, request) {

    var reqHost = request.headers['host'],
        reqUrl = request.url,
        reqHeaders = request.headers,
        port = 80,
        options,
        objUrl,
        hd,
        i,
        self = this;

    if (router[reqHost]) {
        hd = router[reqHost].headers;
        if (hd) {
            for (i = 0; i < hd.length; i += 1) {
                reqHeaders[hd[i].param] = hd[i].value;
            }
        }
        if (router[reqHost].record) {
            self.record.push({"url": reqUrl, "headers": request.headers, "method": request.method});
        }

        if (router[reqHost].newHost) {
            reqUrl = reqUrl.replace(reqHost, router[reqHost].newHost);
            reqHost = router[reqHost].newHost;
        }
    }

    objUrl = url.parse(reqUrl);

    if (objUrl.port) {
        try {
            if (port !== undefined) {
                port = objUrl.port;
            }
        } catch (e) {
            port = 80;
        }
    }

    options = {
        host: reqHost,
        port: port,
        path: reqUrl,
        method: request.method,
        headers: reqHeaders
    };

    return options;

};

ProxyManager.prototype.runRouterProxy = function (minPort, maxPort, host, callback) {

    var options, router, proxy, proxy_request,
        self = this,
        hd,
        i,
        objUrl,
        reqUrl,
        port;

    this.logger.info("Starting Proxy");
    try {

        // Need to check/maintain how many descriptors require proxy.Set path for those descriptors at testSession level
        if (self.routerJsonPath) {
            router = JSON.parse(fs.readFileSync(self.routerJsonPath, "utf-8"));
        } else {
            router = {};
        }

        this.logger.info("Proxy Router Config :" + JSON.stringify(router));

        portchecker.getFirstAvailable(minPort, maxPort, host, function (p, host) {

            if (p === -1) {
                callback("Error : No free ports found for Proxy Server on " + host + " between " + minPort + " and " + maxPort);
            } else {

                self.proxyServer = http.createServer(function (request, response) {

                    options = self.getOptions(router, request);
                    port = options.port;
                    reqUrl = options.path;


                    function isType(mimeRE, urlRE) {
                        return function (req, res) {
                            if (res.headers['content-type']) {
                                return mimeRE.test(res.headers['content-type']);
                            }
                            return urlRE.test(req.url);
                        };
                    }


                    var isJs = isType(/javascript/, /\.js\s*$/);
                    var isHtml = isType(/html/, /\.(htm(l?)|asp(x?)|php|jsp)\s*$/);

                    var proxy_config = {};

                    var instrumenter = proxy_config.instrumenter = new Instrumenter({
                        embedSource: true // we only have URLs to work with, so can't get the source from disk.
                    });
                    var collector = proxy_config.collector = new Collector();
                    var sourceStore = proxy_config.sourceStore = Store.create('memory');

                    proxy_config.passThroughUrls = [];

                    function instrument(source, sourceUrl, proxy_options) {
                        // Generate a valid filepath from the url
                        var filepath = url2path.url2pathRelative(sourceUrl);
                        console.log('filepath ' + filepath);
                        proxy_options.sourceStore.set(filepath, source);
                        return proxy_options.instrumenter.instrumentSync(source, filepath);
                    }


                    proxy_request = http.request(options, function (proxy_response) {

                        proxy_response.setEncoding('utf8');

                        var needsInstrumentation = ~proxy_config.passThroughUrls.indexOf(request.url) || isJs(request, proxy_response);
                        var responseStr = "";

                        proxy_response.addListener('data', needsInstrumentation? function (chunk) {
                            responseStr += chunk;
                        } :function (chunk) {
                            response.write(chunk, 'binary');
                        });

                        proxy_response.addListener('end', function () {

                            console.log('Start to instrument file :'+request.url);
                            console.log('source is '+responseStr);

                            if (needsInstrumentation) {
                                console.log('Start to instrument file :'+request.url);
                                console.log('source is '+responseStr);
                                response.write(instrument(responseStr, request.url, proxy_config));
                            }
                            response.end();
                        });

                        self.writeLog(port + ":" + reqUrl + ":" + proxy_response.statusCode);
                        response.writeHead(proxy_response.statusCode, proxy_response.headers);

                    });

                    request.addListener('data', function (chunk) {
                        proxy_request.write(chunk, 'binary');
                    });

                    request.addListener('end', function () {
                        proxy_request.end();
                    });

                    proxy_request.on('error', function (err, req, res) {
                        self.logger.warn("Proxy Error, Request URL : " + request.url);
                        response.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        response.end('Something went wrong: ' + JSON.stringify(err));
                    });


                }).listen(p);

                console.log('<<Proxy Server started on port:' + p + ">>");
                callback(host + ":" + p);
            }

        });
    } catch (e) {
        //console.log("Error :" + e.toString());
        callback("Error :" + e.toString());
    }
};

ProxyManager.prototype.runIstanbulProxy = function (minPort, maxPort, host, callback) {

    var options, router, proxy,
        self = this,
        hd,
        i,
        objUrl,
        reqUrl,
        port;

    this.logger.info("Starting istanbul Proxy");
    try {

        portchecker.getFirstAvailable(minPort, maxPort, host, function (p, host) {

            if (p === -1) {
                callback("Error : No free ports found for istanbul Proxy Server on " + host + " between " + minPort + " and " + maxPort);
            } else {


                self.proxyServer = http.createServer(function (req, res) {

                    console.log(req.url);

                    var req_options = url.parse(req.url);
                    req_options.headers = req.headers;
                    req_options.method = req.method;


                    console.log('in proxy.......');
                    console.log(req_options);


                    function isType(mimeRE, urlRE) {
                        return function (req, res) {
                            if (res.headers['content-type']) {
                                return mimeRE.test(res.headers['content-type']);
                            }
                            return urlRE.test(req.url);
                        };
                    }


                    var isJs = isType(/javascript/, /\.js\s*$/);
                    var isHtml = isType(/html/, /\.(htm(l?)|asp(x?)|php|jsp)\s*$/);

                    var proxy_config = {};

                    var instrumenter = proxy_config.instrumenter = new Instrumenter({
                        embedSource: true // we only have URLs to work with, so can't get the source from disk.
                    });
                    var collector = proxy_config.collector = new Collector();
                    var sourceStore = proxy_config.sourceStore = Store.create('memory');

                    proxy_config.passThroughUrls = [];

                    function instrument(source, sourceUrl, proxy_options) {
                        // Generate a valid filepath from the url
                        var filepath = url2path.url2pathRelative(sourceUrl);
                        console.log('filepath ' + filepath);
                        proxy_options.sourceStore.set(filepath, source);
                        return proxy_options.instrumenter.instrumentSync(source, filepath);
                    }

                    var proxy_req = http.request(req_options, function (proxy_res) {

                        console.log(proxy_res.statusCode);

                        var needsInstrumentation = ~proxy_config.passThroughUrls.indexOf(req.url) || isJs(req, proxy_res);
                        var responseStr = "";

                        proxy_res.on('data', needsInstrumentation ?
                            function (chunk) {
                            responseStr += chunk;
                        } :
                            function (chunk) {
                            res.write(chunk, 'binary');
                        });

                        proxy_res.on('end', function () {

                            console.log(responseStr.toString());

                            if (needsInstrumentation) {
                                console.log('after instrument:');

                                res.write(instrument(responseStr, req.url, proxy_config));

                            }
                            res.end();
                        });

                        res.writeHead(proxy_res.statusCode, proxy_res.headers);
                        res.end();
                    });

                    req.on('data', function (chunk) {
                        proxy_req.write(chunk, 'binary');
                    });

                    req.on('end', function () {
                        proxy_req.end();
                    });

                    proxy_req.on('error', function (err, req, res) {
                        self.logger.warn("Proxy Error, Request URL : " + req.url);
                        res.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        res.end('Something went wrong: ' + JSON.stringify(err));
                    });

                }).listen(p);

                console.log('<<IStanbul Proxy Server started on port:' + p + ">>");
                callback(host + ":" + p);
            }

        });
    } catch (e) {
        //console.log("Error :" + e.toString());
        callback("Error :" + e.toString());
    }
}


ProxyManager.prototype.writeLog = function (logLine) {

    var StringDecoder = require('string_decoder').StringDecoder,
        decoder = new StringDecoder('utf8'),
        data = decoder.write(logLine + "\n"),
        fd;

    fd = fs.openSync(this.fileName, 'a');
    fs.writeSync(fd, data);
    fs.closeSync(fd);

//    fs.appendFileSync(this.fileName, data);

};

module.exports = ProxyManager;