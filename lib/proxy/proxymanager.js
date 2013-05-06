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

var url2path = require('url2path');
var coverage = require("../util/coverage");
var zlib = require('zlib');

function ProxyManager(proxyConfig, config) {
    this.config = config;
    this.proxyConfig = proxyConfig;
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

    var options, proxy_config, proxy, proxy_request, proxy_coverage,
        self = this,
        hd,
        i,
        objUrl,
        reqUrl,
        port,
        needsClientCoverage = false,
        passthroughurls;

    this.logger.info("Starting Proxy");
    try {

        // Need to check/maintain how many descriptors require proxy.Set path for those descriptors at testSession level
        if (self.proxyConfig) {
            proxy_config = JSON.parse(fs.readFileSync(self.proxyConfig, "utf-8"));
        } else {
            proxy_config = {};
        }

        this.logger.info("Proxy Router Config :" + JSON.stringify(proxy_config));

        portchecker.getFirstAvailable(minPort, maxPort, host, function (p, host) {

            if (p === -1) {
                callback("Error : No free ports found for Proxy Server on " + host + " between " + minPort + " and " + maxPort);
            } else {

                self.proxyServer = http.createServer(function (request, response) {
                    // to make compatible with old routeProxyConfig
                    options = self.getOptions(proxy_config.router || proxy_config, request);
                    port = options.port;
                    reqUrl = options.path;

                    proxy_coverage = proxy_config.coverage || {};
                    needsClientCoverage = proxy_coverage.clientSideCoverage || false;
                    passthroughurls = proxy_coverage.passThroughUrls || [];

                    proxy_request = http.request(options, function (proxy_response) {
                        /*
                         if need instrument:
                         1. clientSideCoverage set to true
                         2. is javascript file
                         3. not part of pass through urls.
                         */

                        var isJs = function(req,res){
                                if (res.headers['content-type']) {
                                    return /javascript/.test(res.headers['content-type']);
                                }
                                return /\.js\s*$/.test(req.url);
                            },
                            isPassthroughurl = function(url){
                                return passthroughurls.indexOf(url) == -1;
                            },
                            needsInstrumentation = needsClientCoverage && isJs(request, proxy_response) && isPassthroughurl(request.url),
                            responseStr = '',
                            buffers = [];

                        proxy_response.addListener('data', needsInstrumentation ? function (chunk) {
                            buffers.push(chunk);
                        } : function (chunk) {
                            response.write(chunk, 'binary');
                        });

                        proxy_response.addListener('end', function () {

                            if (needsInstrumentation) {

                                function instrument(source, sourceUrl, proxy_options) {

                                    var filepath = url2path.url2pathRelative(sourceUrl);
                                    // shorten file path
                                    if (filepath.length > 128)filepath = require('crypto').createHash('md5').update(filepath).digest("hex") + ".js";

                                    var tmpPath = require("../util/sharelibscanner").scannerUtil.getShareLibMetaPath(),
                                        tmpFodler = path.join(tmpPath, 'clientFiles', path.dirname(filepath)),
                                        tmpFile = path.join(tmpPath, 'clientFiles', filepath);

                                    try {
                                        var fileutil = require('../util/fileutil');
                                        new fileutil().createDirectory(tmpFodler);
                                        fs.writeFileSync(tmpFile, source);
                                    } catch (e) {
                                        self.logger.error(e);
                                        tmpFile = filepath;
                                    }
                                    return coverage.instrumentCode(source, tmpFile);
                                }

                                function doInstrument(err, code) {
                                    response.writeHead({'Content-Type': 'text/javascript'});
                                    if (err) {
                                        self.logger.error('decompress code error:' + err);
                                        response.write(responseStr, 'binary');
                                    } else {
                                        self.logger.debug('Start to instrument file :' + request.url);
                                        response.write(instrument(code.toString(), request.url, proxy_config), 'binary');
                                    }
                                    response.end();
                                }

                                switch (proxy_response.headers['content-encoding']) {
                                    case 'gzip':
                                        zlib.unzip(Buffer.concat(buffers), doInstrument);
                                        break;
                                    case 'deflate':
                                        zlib.inflate(Buffer.concat(buffers), doInstrument);
                                        break;
                                    default:
                                        doInstrument(null, Buffer.concat(buffers));
                                        break;
                                }

                            } else {
                                response.end();
                            }
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