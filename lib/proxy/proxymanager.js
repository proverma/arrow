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
var httpProxy = require('http-proxy');


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

    reqHeaders['reqUrl'] = reqUrl; // not standard in headers

    objUrl = url.parse(reqUrl);

    reqHost = (reqHost && reqHost.match(/:/g) ) ? reqHost.slice(0, reqHost.indexOf(":")) : reqHost;
    options = {
        host: reqHost,
        port: parseInt(objUrl.port) || port,
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
                proxy_config = {};
            }
        }

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
                            return /javascript/.test(res.headers['content-type']);
                        }
                        return /\.js\s*$/.test(req.url);
                    },
                    sessionsStatsMap = {},
                    currentSID;

                self.proxyServer = http.createServer(function (request, response) {
                    // get client sent coverage request

                    var headers = {"Content-Type": "text/plain",
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Max-Age': '600',
                        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                        'Access-Control-Expose-Headers': 'Content-Length',
                        'Access-Control-Allow-Credentials': 'true'
                    };

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
                            console.log(currentSID)
                            sessionsStatsMap[currentSID].testFinish = true;  // some page send a POST then the test should be finished
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
                                    self.logger.debug('get client sent coverage POST request from ' + json.origin);
                                } catch (e) {
                                }
                                response.writeHead(200, headers);
                                response.end();
                            });
                        }
                    } else {
                        // to make compatible with old routeProxyConfig
                        var options, reqUrl, fakeUrl;
                        options = self.getOptions(proxy_config.router || proxy_config, request);
                        reqUrl = options.headers['reqUrl'];

                        proxy_coverage = proxy_config.coverage || {};
                        needsClientCoverage = self.config.coverage && proxy_coverage.clientSideCoverage;
                        passthroughurls = proxy_coverage.coverageExclude || [];

                        proxy_request = http.request(options, function (proxy_response) {
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
                                buffers = [];

                            proxy_response.addListener('data', needsInstrumentation || needsRewrite ? function (chunk) {
                                buffers.push(chunk);
                            } : function (chunk) {
                                response.write(chunk, 'binary');
                            });

                            proxy_response.addListener('end', function () {

                                if (needsInstrumentation || needsRewrite) {

                                    function instrument(source, sourceUrl, proxy_options) {

                                        var filepath = url2path.url2pathRelative(sourceUrl);
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

                                                console.log(sessionsStatsMap)

                                                responseStr = code.toString();
                                                updateClientScript = function (coveragepath) {
                                                    var clientjs = "";
                                                    clientjs += fs.readFileSync(path.join(__dirname, 'proxy-client.js'), 'utf8');
                                                    return clientjs.replace(/%PROXY_PATH%/g, coveragepath).replace(/%SESSION_ID%/g, sid);
                                                }
                                                insertMatch = /<script>|<\/head>/.exec(responseStr);
                                                insertIndex = insertMatch && insertMatch.index || 0;
                                                var coveragepath = "http://" + host + ":" + p + "/proxyCoverage";

                                                responseStr = responseStr.substring(0, insertIndex) +
                                                    "<script>" + updateClientScript(coveragepath) + "</script>" +
                                                    responseStr.substring(insertIndex);

                                                self.logger.trace(responseStr);

                                                response.write(responseStr, 'binary');

                                                self.logger.debug('Rewrite html file :' + reqUrl + " success!");
                                                response.end();
                                            }

                                            /*
                                             we have to query for session id for a complex test scenario,
                                             it would be multiple controller and driver, for default controller, we can get current session id
                                             but for locator or customer's controller ,then session id can retrive from selenium hub.
                                             Usually when new a controller ,there would be a driver property ,this driver instance contanis a weddriver
                                             which contains sessionid, this make sure the most recent session id is belong to current "test"
                                             */

                                            currentSID = global.currentSessionid;
                                            if (currentSID) {
                                                rewriteHtml(currentSID);
                                            } else {
                                                var wdsession = require("../session/wdsession");
                                                var hub = new wdsession(self.config);
                                                hub.getSessions(self, function (error, sf, arrSessions) {
                                                    if (error) {
                                                        return rewriteHtml(Math.random() * 100000000);
                                                    }
                                                    console.log('get session id from hud');
                                                    currentSID = arrSessions[arrSessions.length - 1];  // the most current session id
                                                    return rewriteHtml(currentSID);
                                                });
                                            }
                                        }
                                    }

                                    switch (proxy_response.headers['content-encoding']) {
                                        case 'gzip':
                                            zlib.unzip(Buffer.concat(buffers), needsInstrumentation ? doInstrument : doRewrite);
                                            break;
                                        case 'deflate':
                                            zlib.inflate(Buffer.concat(buffers), needsInstrumentation ? doInstrument : doRewrite);
                                            break;
                                        default:
                                            needsInstrumentation ? doInstrument(null, Buffer.concat(buffers)) : doRewrite(null, Buffer.concat(buffers));
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
                            self.logger.warn("Proxy Error, Request options : " + JSON.stringify(options));
                            response.writeHead(500, {
                                'Content-Type': 'text/plain'
                            });
                            response.end('Something went wrong: ' + JSON.stringify(err));
                        });

                    }
                }).listen(p);

                self.logger.info('<<Proxy Server started on port:' + p + ">>");
                callback(host + ":" + p);
            }

        });
    } catch (e) {

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