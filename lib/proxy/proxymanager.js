/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js"),
    fs = require('fs'),
    path = require('path'),
    portchecker = require("../../ext-lib/portchecker"),
    url = require('url');

var coverage = require("../util/coverage");
var zlib = require('zlib');

function ProxyManager(proxyConfig, config, proxyStream) {
    this.config = config || {};
    this.proxyConfig = proxyConfig || {};
    this.logger = log4js.getLogger("ProxyManager");
    global.proxyManager = {};
    global.proxyManager.record = [];

    this.proxyStream = proxyStream;

}

/**
 *
 * @param router
 * @param request
 * @param response
 */
ProxyManager.prototype.recordTraffic = function(router, request, response) {

    var reqHost = request.headers['host'],
        onlyhost,
        reqUrl = request.url,
        self = this,
        obj = global.proxyManager.record[self.proxyConfig] || [];

    /*
     host could be www.yahoo.com or localhost:8080,check both and
     remove port info for non-80 host,this would support route localhost:8080 -> localhost:8081
     */
    onlyhost = (reqHost && reqHost.match(/:/g)) ? reqHost.slice(0, reqHost.indexOf(":")) : reqHost;

    // request host is localhost:8080,then define "localhost:8080" or "localhost" would be all OK
    if (router[reqHost] || router[onlyhost]) {

        if ((router[reqHost] && router[reqHost].record)) {
            obj.push({"url": reqUrl, "headers": request.headers, "responseHeaders": response.headers, "method": request.method});
            global.proxyManager.record[self.proxyConfig] = obj;
        }

    }

};

/**
 *
 * @param router - proxy configuration defined in json file
 * @param request - request
 * @return {Object} - Options
 */
ProxyManager.prototype.getOptions = function (router, request) {

    var reqHost = request.headers['host'],
        onlyhost,
        reqUrl = request.url,
        reqHeaders = request.headers,
        port = 80,
        options,
        objUrl,
        hd,
        i;

    /*
     host could be www.yahoo.com or localhost:8080,check both and
     remove port info for non-80 host,this would support route localhost:8080 -> localhost:8081
     */
    onlyhost = (reqHost && reqHost.match(/:/g)) ? reqHost.slice(0, reqHost.indexOf(":")) : reqHost;

    // reqest host is localhost:8080,then define "localhost:8080" or "localhost" would be all OK
    if (router[reqHost] || router[onlyhost]) {
        router[reqHost] = router[reqHost] || router[onlyhost];
        hd = router[reqHost].headers;
        if (hd) {
            for (i = 0; i < hd.length; i += 1) {
                reqHeaders[hd[i].param] = hd[i].value;
            }
        }

        if (router[reqHost].newHost) {
            reqUrl = reqUrl.replace(reqHost, router[reqHost].newHost);
            reqHost = router[reqHost].newHost;
        }

    }

    reqHeaders['reqUrl'] = reqUrl; // not standard in headers

    objUrl = url.parse(reqUrl);

    port = (reqHost && reqHost.match(/:/g)) ? reqHost.slice(reqHost.indexOf(":") + 1, reqHost.length) : port;
    reqHost = (reqHost && reqHost.match(/:/g)) ? reqHost.slice(0, reqHost.indexOf(":")) : reqHost;

    reqHeaders['protocol'] = objUrl.protocol || 'http:'; // not standard in headers

    options = {
        host: reqHost,
        port: objUrl.port || port,
        path: objUrl.path || "/",
        method: request.method,
        headers: reqHeaders
    };
    return options;

};

ProxyManager.prototype.runRouterProxy = function (minPort, maxPort, host, callback) {

    var self = this, i, port,
        proxy_config = {},
        proxy_request,
        proxy_coverage,
        passthroughurls,
        needsClientCoverage = false,
        tmpPath = require("../util/sharelibscanner").scannerUtil.getShareLibMetaPath();

    try {

        // Need to check/maintain how many descriptors require proxy.Set path for those descriptors at testSession level
        if (self.proxyConfig) {
            try {
                proxy_config = JSON.parse(fs.readFileSync(self.proxyConfig, "utf-8"));
            } catch (e) {
                proxy_config = self.proxyConfig;
            }
        }

        // Added for debugging
        process.on('uncaughtException', function(err) {
            self.logger.error("Uncaught exception :" + err.stack);
        });

        this.logger.trace("Proxy Router Config :" + JSON.stringify(proxy_config));

        portchecker.getFirstAvailable(minPort, maxPort, host, function (p, host) {

            host = host === "localhost" ? require('../../arrow_server/arrowservermanager').getLocalhostIPAddress() : host;

            if (p === -1) {
                callback("Error : No free ports found for Proxy Server on " + host + " between " + minPort + " and " + maxPort);
            } else {

                var isHtml = function (req, res) {
                        if (res.headers['content-type']) {
                            return /html/.test(res.headers['content-type']);
                        }
                        return /\.(htm(l?)|asp(x?)|php|jsp)\s*$/.test(req.url);
                    },
                    isJs = function (req, res) {
                        if (res.headers['content-type']) {
                            // some jsonp (callback=url) calls' content-type is text/javascript but we can't instrument that.
                            return /javascript/.test(res.headers['content-type']) && /\.js\s*$/.test(req.url);
                        }
                        return /\.js\s*$/.test(req.url);
                    },
                    url2pathRelative = function (url) {
                        var windowsPathComponentReplacerRE = /[\\\/\?\*\|<>":_]/g;

                        function pathComponentReplacer(str) {
                            return '_' + str.charCodeAt(0).toString(16) + '_';
                        }

                        function encodePathComponent(str) {
                            windowsPathComponentReplacerRE.lastIndex = 0;
                            return str.replace(windowsPathComponentReplacerRE, pathComponentReplacer);
                        }

                        return url.replace('://', '/')
                            .split('/')
                            .map(decodeURIComponent)
                            .map(encodePathComponent)
                            .join('/');
                    },
                    sessionsStatsMap = {},
                    currentSID,
                    timeout = self.config.testTimeOut || 30000;

                self.proxyServer = require('http').createServer(function (request, response) {
                    // get client sent coverage request
                    var headers = {"Content-Type": "text/plain",
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Max-Age': '60000',
                        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                        'Access-Control-Expose-Headers': 'Content-Length',
                        'Access-Control-Allow-Credentials': 'true'
                    };

                    request.on('error', function (err, req) {
                        self.logger.warn("Proxy Error, Request options : " + JSON.stringify(options));
                        self.logger.warn('Something went wrong: ' + JSON.stringify(err));
                    });

                    if (url.parse(request.url).pathname === '/proxyCoverage') {
                        if (request.method === 'OPTIONS') {
                            response.writeHead(200, headers);
                            response.end();
                        } else if (request.method === 'GET') {
                            // get coverage status
                            var targetSID = url.parse(request.url, true).query['sid'] || null;
                            self.logger.trace('get client sent coverage GET request from ' + request.headers['referer'] + " with session id:" + targetSID);
                            if (sessionsStatsMap[targetSID] && sessionsStatsMap[targetSID].testFinish == true) {
                                response.writeHead(200, headers);
                            } else {
                                response.writeHead(210, headers);  // not ready
                            }
                            response.end();

                        } else if (request.method === 'POST') {
                            // some page send a POST then the test should be finished
                            var reqBody = '';
                            request.on('data', function (chunk) {
                                reqBody += chunk;
                            });
                            request.on('end', function () {
                                var json;
                                try {
                                    json = JSON.parse(reqBody);
                                    if (json) {
                                        coverage.addCoverage(json.coverage || {});
                                    }
                                    json.sid = json.sid || currentSID;
                                    sessionsStatsMap[json.sid] = sessionsStatsMap[json.sid] || {};
                                    sessionsStatsMap[json.sid].testFinish = true;
                                    self.logger.debug('get client sent coverage POST request from ' + json.origin + " with session id: " + json.sid);
                                } catch (e) {
                                    sessionsStatsMap[currentSID] = sessionsStatsMap[currentSID] || {};
                                    sessionsStatsMap[currentSID].testFinish = true;
                                }
                                response.writeHead(200, headers);
                                response.end();
                            });
                            request.on('error', function (err, req) {
                                self.logger.warn("Proxy Error, Request options : " + JSON.stringify(options));
                                self.logger.warn('Something went wrong: ' + JSON.stringify(err));
                            });
                        }
                    } else {
                        // to make compatible with old routeProxyConfig
                        var options, reqUrl, handle,f_http;
                        options = self.getOptions(proxy_config.router || proxy_config, request);

                        reqUrl = options.headers['reqUrl'];

                        proxy_coverage = proxy_config.coverage || {};
                        needsClientCoverage = proxy_coverage.clientSideCoverage;
                        passthroughurls = proxy_coverage.coverageExclude || [];

                        handle = options.headers['protocol'] === 'https:' ? 'https' : 'http';
                        f_http = require('./../../ext-lib/follow_redirect_http.js')[handle];

                        options.agent = false;

                        proxy_request = f_http.request(options, function (proxy_response) {

                            // Record network traffic
                            self.recordTraffic(proxy_config.router || proxy_config, request, proxy_response);

                            /*
                             if need instrument:
                             1. clientSideCoverage set to true
                             2. is javascript file
                             3. not part of pass through urls.
                             */

                            var isPassthroughurl = function (url) {
                                    if (!passthroughurls || passthroughurls.length == 0)return false;
                                    if (passthroughurls.indexOf(url) !== -1)return true;
                                    for (i = 0; i < passthroughurls.length; i++) {
                                        if (new RegExp(passthroughurls[i]).test(url)) return true;
                                    }
                                    return false;
                                },
                                needsInstrumentation = needsClientCoverage && isJs(request, proxy_response) && !isPassthroughurl(reqUrl),
                                needsRewrite = needsClientCoverage && isHtml(request, proxy_response) && !isPassthroughurl(reqUrl),
                                responseStr = '',
                                tmpStr = '',
                                buffers = [],
                                bufferLen = 0;

                            proxy_response.addListener('error', function () {});
                            proxy_response.addListener('data', needsInstrumentation || needsRewrite ? function (chunk) {
                                buffers.push(chunk);
                                bufferLen += chunk.length;
                            } : function (chunk) {
                                response.write(chunk, 'binary');
                            });

                            proxy_response.addListener('end', function () {

                                if (needsInstrumentation || needsRewrite) {

                                    function instrument(source, sourceUrl, proxy_options) {

                                        var filepath = url2pathRelative(sourceUrl);
                                        if (filepath.length > 128) {
                                            filepath = require('crypto').createHash('md5').update(filepath).digest("hex") + ".js";
                                        }
                                        filepath = path.join(tmpPath, 'clientfiles', filepath);
                                        return {"code": coverage.instrumentCode(source, filepath), "path": filepath};
                                    }

                                    function saveClientFile(filepath, source) {
                                        var existsSync = fs.existsSync || path.existsSync;
                                        if (!existsSync(path.dirname(filepath))) {
                                            var FileUtil = require('../util/fileutil');
                                            new FileUtil().createDirectory(path.dirname(filepath));
                                        }
                                        try {
                                            fs.writeFileSync(filepath, source);
                                        } catch (e) {
                                            self.logger.error(e);
                                        }
                                    }

                                    function doInstrument(err, code) {
                                        response.writeHead({'Content-Type': 'text/javascript'});
                                        var codeAndPath;
                                        if (err) {
                                            self.logger.error('decompress code error:' + err);
                                            response.write(responseStr, 'binary');
                                        } else {
                                            codeAndPath = instrument(code.toString(), reqUrl, proxy_config);
                                            response.write(codeAndPath.code, 'binary');
                                            self.logger.trace('Instrument file :' + reqUrl + " success!");
                                        }
                                        response.end();
                                        saveClientFile(codeAndPath.path, code.toString()); //save client file for coverage report
                                    }

                                    function doRewrite(err, code) {
                                        response.writeHead({'Content-Type': 'text/html'});
                                        var insertMatch, insertIndex, updateClientScript;
                                        if (err) {
                                            self.logger.error('decompress code error:' + err);
                                            response.write(responseStr, 'binary');
                                            response.end();
                                        } else {
                                            function rewriteHtml(sid) {

                                                sessionsStatsMap[sid] = sessionsStatsMap[sid] || {};
                                                sessionsStatsMap[sid].testFinish = sessionsStatsMap[sid].testFinish || false;

                                                responseStr = code.toString();
                                                updateClientScript = function (coveragepath) {
                                                    var clientjs = "";
                                                    clientjs += fs.readFileSync(path.join(__dirname, 'proxy-client.js'), 'utf8');
                                                    return clientjs.replace(/%PROXY_PATH%/g, coveragepath).replace(/%SESSION_ID%/g, sid).replace(/%TIME_OUT%/g, timeout);
                                                }
                                                insertMatch = /<script>|<\/head>/.exec(responseStr);
                                                insertIndex = insertMatch && insertMatch.index || 0;
                                                var coveragepath = "http://" + host + ":" + p + "/proxyCoverage";

                                                responseStr = responseStr.substring(0, insertIndex) +
                                                    "<script>" + updateClientScript(coveragepath) + "</script>" +
                                                    responseStr.substring(insertIndex);

                                                response.write(responseStr, 'binary');

                                                self.logger.debug('Rewrite html file :' + reqUrl + " success!");
                                                response.end();
                                            }

                                            /*
                                             we have to query for session id for a complex test scenario,
                                             it would be multiple controller/driver, for default controller, we can get current session id
                                             but for locator or customer's controller ,then session id can be retrived from selenium hub.
                                             Usually when new a controller ,there would be a driver property ,this driver instance contains a weddriver
                                             which contains sessionid, this make sure the we always get a session id belong to current "test" even it's not
                                             the "actual" session id, we just need it to identify current "test".
                                             */

                                            currentSID = global.currentSessionid;
                                            self.logger.trace('Get current sid: ' + currentSID);
                                            if (currentSID) {
                                                rewriteHtml(currentSID);
                                            } else {
                                                var wdsession = require("../session/wdsession");
                                                var hub = new wdsession(self.config);
                                                hub.getSessions(self, function (error, sf, arrSessions) {
                                                    if (error) {
                                                        return rewriteHtml(Math.random() * 100000000);
                                                    }
                                                    currentSID = arrSessions[arrSessions.length - 1];  // the most current session id
                                                    self.logger.trace('Get session id from hud: ' + currentSID);
                                                    return rewriteHtml(currentSID);
                                                });
                                            }
                                        }
                                    }

                                    if (typeof Buffer.concat === "function") {
                                        tmpStr = Buffer.concat(buffers);
                                    } else {
                                        var buffer = null;
                                        switch (buffers.length) {
                                            case 0:
                                                buffer = new Buffer(0);
                                                break;
                                            case 1:
                                                buffer = buffers[0];
                                                break;
                                            default:
                                                buffer = new Buffer(bufferLen);
                                                for (var i = 0, pos = 0, l = buffers.length; i < l; i++) {
                                                    var chunk = buffers[i];
                                                    chunk.copy(buffer, pos);
                                                    pos += chunk.length;
                                                }
                                                break;
                                        }
                                        tmpStr = buffer;
                                    }

                                    switch (proxy_response.headers['content-encoding']) {
                                        case 'gzip':
                                            zlib.unzip(tmpStr, needsInstrumentation ? doInstrument : doRewrite);
                                            break;
                                        case 'deflate':
                                            zlib.inflate(tmpStr, needsInstrumentation ? doInstrument : doRewrite);
                                            break;
                                        default:
                                            needsInstrumentation ? doInstrument(null, tmpStr) : doRewrite(null, tmpStr);
                                            break;
                                    }

                                } else {
                                    response.end();
                                }
                            });

                            self.writeLog(port + ":" + reqUrl + ":" + proxy_response.statusCode);

                            //(url, resHeaders)
                            response.writeHead(proxy_response.statusCode, proxy_response.headers);


                        });

                        request.addListener('data', function (chunk) {
                            proxy_request.write(chunk, 'binary');
                        });

                        request.addListener('end', function () {
                            proxy_request.end();
                        });
                        request.addListener('error', function () {
                            self.logger.warn("Proxy Error, Request options : " + JSON.stringify(options));
                            response.writeHead(500, {
                                'Content-Type': 'text/plain'
                            });
                            response.end('Something went wrong: ' + JSON.stringify(err));
                        });

                        proxy_request.on('error', function (err, req, res) {
                            self.logger.warn("Proxy Error, Request options : " + JSON.stringify(options));
                            response.writeHead(500, {
                                'Content-Type': 'text/plain'
                            });
                            response.end('Something went wrong: ' + JSON.stringify(err));
                        });

                    }
                }).listen(p);

                var net = require('net');
                var createSSLCallback = function (req, socket, head) {
                    var uri = req.url.split(':');
                    var host = uri[0].toLowerCase(),
                        port = uri[1];
                    var obj = global.proxyManager.record[self.proxyConfig] || [], router = proxy_config.router || proxy_config;

                    if (router[host]) {
                        obj.push({"url": req.url, "headers": req.headers, "method": req.method});
                        global.proxyManager.record[self.proxyConfig] = obj;
                    }

                    var tunnel = net.connect({
                        port: port,
                        host: host
                    }, function() {
                        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                        tunnel.write(head);
                        tunnel.pipe(socket);
                        socket.pipe(tunnel);
                    });
                    tunnel.on('error', function(err) {
                        self.logger.info("ssl connection error: " + err + " url: " + req.url);
                    });
                    tunnel.on('close', function() {
                        socket.destroy();
                    });
                };
                self.proxyServer.on('connect', createSSLCallback);
                self.proxyServer.on('error', function(err, req){
                    if(err) self.logger.log('Error is: ' + err);
                    self.logger.info('Ooops, something went very wrong... req was '+JSON.stringify(req));
                });

                self.logger.info('<<Proxy Server started on port:' + p + ">>");
                callback(host + ":" + p);
            }

        });
    } catch (e) {

        callback("Error :" + e.toString());
    }
};

ProxyManager.prototype.writeLog = function (logLine, cb) {

    var StringDecoder = require('string_decoder').StringDecoder,
        decoder = new StringDecoder('utf8'),
        data = decoder.write(logLine + "\n"),
        self = this;

    try {
        if (self.proxyStream) {
            self.proxyStream.write(data);
        }

        if (cb) {
            cb();
        }
    }
    catch(e){
        self.logger.error('Exception in writing log ');
    }
};

module.exports = ProxyManager;