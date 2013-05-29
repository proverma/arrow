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

function ProxyManager(routerConfig) {
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
ProxyManager.prototype.getOptions = function(router, request) {

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

ProxyManager.prototype.runRouterProxy = function(minPort, maxPort, host, callback) {

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

        portchecker.getFirstAvailable(minPort, maxPort, host, function(p, host) {

            if (p === -1) {
                callback("Error : No free ports found for Proxy Server on " + host + " between " + minPort + " and " + maxPort);
            } else {

                self.proxyServer = http.createServer(function (request, response) {

                    options = self.getOptions(router, request);
                    port = options.port;
                    reqUrl = options.path;

                    proxy_request = http.request(options, function(proxy_response) {

                        proxy_response.addListener('data', function(chunk) {
                            response.write(chunk, 'binary');
                        });

                        proxy_response.addListener('end', function() {
                            response.end();
                        });

                        self.writeLog(port + ":" + reqUrl + ":" + proxy_response.statusCode);
                        response.writeHead(proxy_response.statusCode, proxy_response.headers);

                    });

                    request.addListener('data', function(chunk) {
                        proxy_request.write(chunk, 'binary');
                    });

                    request.addListener('end', function() {
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

                //console.log('<<\nProxy Server started on port-'+p);
                callback(host + ":" + p);
            }

        });
    } catch (e) {
        //console.log("Error :" + e.toString());
        callback("Error :" + e.toString());
    }
};

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