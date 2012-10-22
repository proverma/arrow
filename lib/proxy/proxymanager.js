/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var http = require('http'),
    log4js = require("log4js"),
    fs = require('fs'),
    portchecker = require('portchecker'),
    path = require('path');

function ProxyManager (routerConfig) {
    this.routerJsonPath = routerConfig;
    this.logger = log4js.getLogger("ProxyManager");
    this.fileName = path.resolve(global.workingDirectory,"proxy.log")
}

ProxyManager.prototype.runRouterProxy = function(minPort,maxPort,host,callback) {
    var options,router
        self = this;
    this.logger.info("Starting Proxy");
    try {

        if(self.routerJsonPath) {
            router = JSON.parse(fs.readFileSync(self.routerJsonPath, "utf-8"));
        } else {
            router = {};
        }

       this.logger.info("Proxy Router Config :" + JSON.stringify(router));

        portchecker.getFirstAvailable(minPort, maxPort, host, function(p, host) {
            if (p === -1) {
               // console.log('No free ports found for GhostDriver on ' + host + ' between ' + minPort + ' and ' + minPort);
                callback("Error : No free ports found for Proxy Server on " + host + " between " + minPort + " and " + minPort);
            } else {

                self.proxyServer = http.createServer(function (request, response) {
                    var host = request.headers['host'],
                        url = request.yiv_get_url('url');

                    if(router[host]) {
                        url = url.replace(host,router[host])
                        host = router[host];
                    }

                    var proxy = http.createClient(80, host),
                        proxy_request = proxy.request(request.method, url, request.headers);

                    proxy_request.addListener('response', function (proxy_response) {
                        proxy_response.addListener('data', function(chunk) {
                            response.write(chunk, 'binary');
                        });
                        proxy_response.addListener('end', function() {
                            response.end();
                        });

                        self.writeLog(url + ":" + proxy_response.statusCode);
                        response.writeHead(proxy_response.statusCode, proxy_response.headers);
                    });

                    request.addListener('data', function(chunk) {
                        proxy_request.write(chunk, 'binary');
                    });

                    request.addListener('end', function() {
                        proxy_request.end();
                    });

                    proxy.on('error', function (err, req, res) {
                        self.logger.warn("Proxy Error, Request URL : " + request.url);
                        response.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        response.end('Something went wrong: ' + JSON.stringify(err));
                    });

                    proxy.on('proxyError', function (err, req, res) {
                        self.logger.warn("Proxy proxyError, Request URL : " + request.url);
                        response.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        response.end('Something went wrong: ' + JSON.stringify(err));
                    });



                }).listen(p);
                callback(host + ":"+ p);

            }
        });
    } catch (e){
        //console.log("Error :" + e.toString());
        callback("Error :" + e.toString() );
    }
}

ProxyManager.prototype.writeLog = function (logLine) {
    //console.log(logLine);
    var stream = fs.createWriteStream(this.fileName);
    stream.once('open', function(fd) {
        stream.write(logLine + "\n");
    });

}

module.exports = ProxyManager;
