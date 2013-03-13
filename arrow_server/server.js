#!/usr/bin/env node

/*jslint forin:true sub:true anon:true sloppy:true stupid:true nomen:true node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require("fs");
var os = require("os");
var urlParser = require("url");
var querystring = require("querystring");
var path = require("path");
var nopt = require("nopt");
var http = require("http");
var express = require("express");
var log4js = require("log4js");
var portchecker = require('../ext-lib/portchecker');

log4js.setGlobalLogLevel("INFO");
var logger = log4js.getLogger("ArrowServer");

var debug = false;
var arrowHost = "localhost";
var arrowPortMin = 10000;
var arrowPortMax = 11000;
var arrowPort = 0;
var arrowAddress = "";
var parsed = nopt();

//setting appRoot
global.appRoot = path.resolve(__dirname, "..");

//help messages
function showHelp() {
    console.info("\nOPTIONS :" + "\n" +
        "        --host : (optional) Fully qualified name of host where arrow server is running. (default: localhost)" + "\n" +
        "        --port : (optional) Arrow Server Port. (default: 4459) " + "\n\n"
    );

    console.log("\nEXAMPLES :" + "\n" +
        "        For local usage: " + "\n" +
        "          arrow_server ( Arrow server will start listening to localhost:4459 )" + "\n\n" +
        "        For remote usage: " + "\n" +
        "          arrow_server --host=<yourhostname> --port=4800 ( Arrow server will start listening to <yourhostname>:4800) " + "\n\n");
}

if (parsed.help) {
    showHelp();
    process.exit(0);
}

if (parsed["host"]) {
    arrowHost = parsed["host"];
}
if (!arrowHost || arrowHost === "localhost") {
    var servermanager=require("../lib/util/arrowservermanager");
    arrowHost = servermanager.getProperIPAddressForArrowServer() || "localhost" ;
}

if (parsed["port"]) {
    var port = String(parsed["port"]);
    if (-1 === port.indexOf("-")) {
        arrowPortMin = arrowPortMax = parseInt(port, 10);
    } else {
        var range = port.split("-");
        arrowPortMin = parseInt(range[0], 10);
        arrowPortMax = parseInt(range[1], 10);
    }
}

if (parsed["debug"]) {
    debug = true;
}

var app = express();
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());

var mimes = {
    "css":"text/css",
    "js":"text/javascript",
    "htm":"text/html",
    "html":"text/html",
    "ico":"image/vnd.microsoft.icon",
    "jpg":"image/jpeg",
    "gif":"image/gif",
    "png":"image/png",
    "xml":"text/xml"
};

function serveStatic(pathname, req, res) {
    fs.readFile(pathname, function (error, content) {
        var tmp,
            ext,
            mime;

        if (error) {
            res.writeHead(404);
            res.end("Error loading file " + pathname + ": " + error, "utf-8");
        } else {
            tmp = pathname.lastIndexOf(".");
            ext = pathname.substring((tmp + 1));
            mime = mimes[ext] || "text/plain";

            res.writeHead(200, {"Content-Type":mime});
            res.end(content);
        }
    });
}


function cleanUp() {
    try {
        fs.unlinkSync(global.appRoot + "/tmp/arrow_server.status");
    } catch (ex) {
    }

    console.log("Good bye!");
}

// file server
app.get("/arrow", function (req, res) {
    serveStatic(__dirname + "/../lib/client/driver.html", req, res);
});
app.get("/arrow/static/*", function (req, res) {
    serveStatic("/" + req.params[0], req, res);
});

// selenium ip hookup
app.get("/arrow/wd/:selPort", function (req, res) {
    var selUrl = "http://" + req.connection.remoteAddress + ":" + req.params.selPort + "/wd/hub";
    fs.writeFileSync("/tmp/arrow_sel_server.status", selUrl);
    res.end("Selenium captured at: " + selUrl, "utf-8");
});

var sessions = [];
var wdtasks = [];
var wdTaskCounter = 0;

// shared functions
function validateSession(req, res) {
    var sessionId = req.params.sessionId,
        body;

    if (sessions.hasOwnProperty(sessionId)) {
        return true;
    }

    body = {
        status:9,
        value:"No such sessionId: " + sessionId
    };
    res.send(body, 404);
    return false;
}

function queueWdTask(params, req, res) {
    var sessionId = req.params.sessionId,
        curTask,
        body,
        task,
        conn,
        session;

    if (wdtasks.hasOwnProperty(sessionId)) {
        curTask = wdtasks[sessionId];
        if (curTask) {
            body = {
                status:9,
                value:"A command is still running for sessionId: " + sessionId
            };
            res.send(body, 500);
            return false;
        }
    }

    task = {
        "id":"taskid-" + wdTaskCounter,
        "params":params,
        "statusCode":0,
        "httpCode":200
    };
    wdtasks[sessionId] = {
        "request":req,
        "response":res,
        "task":task
    };
    wdTaskCounter += 1;

    session = sessions[sessionId];
    session.response.send(task);
    delete sessions[sessionId]; // we dont need this anymore

    conn = req.connection;
    conn.on("close", function () {
        if (wdtasks.hasOwnProperty(sessionId)) {
            if (debug) {
                console.log("Task connection closed, deleting task for session: " + sessionId);
            }
            delete wdtasks[sessionId];
        }
    });

    return true;
}

// browsers running webdriver sessions
app.post("/arrow/slave/:sessionId", function (req, res) {
    var timestamp = (new Date()).getTime(),
        sessionId = req.params.sessionId,
        prevTask = req.body,
        prevTaskInfo,
        resBody,
        oldSession,
        conn;

    if (debug) {
        console.log("Agent response:");
        console.log(req.body);
    }
    prevTask = req.body;

    // a task is also completed, send it to wd client
    // TODO: validate that the task id matches
    if (prevTask && prevTask.id && (wdtasks.hasOwnProperty(sessionId))) {
        prevTaskInfo = wdtasks[sessionId];
        delete wdtasks[sessionId];

        resBody = {
            "status":prevTask.statusCode,
            "sessionId":sessionId,
            "value":prevTask.result
        };
        if (debug) {
            console.log("Task result:");
            console.log(resBody);
        }
        prevTaskInfo.response.send(resBody, prevTask.httpCode);
    }

    if (sessions.hasOwnProperty(sessionId)) {
        if (debug) {
            console.log("Killing old connection for session: " + sessionId);
        }
        oldSession = sessions[sessionId];
        oldSession.response.end();
        delete sessions[sessionId];
    }

    console.log("Session registered: " + sessionId);
    sessions[sessionId] = {
        "sessionId":sessionId,
        "timestamp":timestamp,
        "request":req,
        "response":res
    };

    conn = req.connection;
    conn.on("close", function () {
        if (sessions.hasOwnProperty(sessionId)) {
            oldSession = sessions[sessionId];
            if (oldSession.timestamp === timestamp) {
                if (debug) {
                    console.log("Session deleted: " + sessionId);
                }
                delete sessions[sessionId];
            } else {
                if (debug) {
                    console.log("Session already recaptured: " + sessionId);
                }
            }
        }
    });
});

// webdriver
// Query the server status
app.get("/wd/hub/status", function (req, res) {
    var body;

    res.contentType("application/json");
    body = {
        build:{ version:"1.0" },
        os:{ name:"rhel" }
    };
    res.send(body);
});

// Create a new session
app.post("/wd/hub/session", function (req, res) {
    res.contentType("application/json");
    res.send({status:9, value:"Create session: Not Implemented"}, 501);
});

// Get all sessions
app.get("/wd/hub/sessions", function (req, res) {
    var sessionIds = [],
        sessionId,
        body;

    res.contentType("application/json");

    sessionIds = [];
    for (sessionId in sessions) {
        sessionIds.push({"id":sessionId});
    }

    body = {
        status:0,
        value:sessionIds
    };
    res.send(body);
});

// Retrieve the capabilities of the specified session
app.get("/wd/hub/session/:sessionId", function (req, res) {
    var body,
        session;

    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    session = sessions[req.params.sessionId];
    body = {
        status:0,
        sessionId:req.params.sessionId,
        value:{
            platform:"ANY",
            cssSelectorsEnabled:true,
            javascriptEnabled:true,
            browserName:session.request.headers["user-agent"],
            nativeEvents:true,
            takesScreenshot:false,
            version:1
        }
    };

    res.send(body);
});

// Delete the session
app.del("/wd/hub/session/:sessionId", function (req, res) {
    res.contentType("application/json");
    res.send({status:9, value:"Delete session: Not Implemented"}, 501);
});

// Get the current page title
app.get("/wd/hub/session/:sessionId/title", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"title"}, req, res);
});

// Get the current page url
app.get("/wd/hub/session/:sessionId/url", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"url"}, req, res);
});

var revProxyHost = "";
var revProxyPort = 80;
// Navigate to the url
app.post("/wd/hub/session/:sessionId/url", function (req, res) {
    var url,
        reqParams,
        reqHost,
        reqPort;

    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }
    url = req.body.url;

    reqParams = urlParser.parse(url);
    reqHost = reqParams.hostname;
    reqPort = 80;
    if (reqParams.port) {
        reqPort = reqParams.port;
    }
    if ((reqHost === arrowHost) && (reqPort === arrowPort)) {
        if (debug) {
            console.log("Reverse proxy disabled");
        }
        revProxyHost = "";
    } else {
        console.log("Reverse proxy enabled for: " + reqHost + ":" + reqPort);
        revProxyHost = reqHost;
        revProxyPort = reqPort;
        url = arrowAddress + reqParams.pathname;
    }

    queueWdTask({"type":"navigate", "url":url}, req, res);
});

// Execute sync script
app.post("/wd/hub/session/:sessionId/execute", function (req, res) {
    var script;

    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    script = req.body.script;
    queueWdTask({"type":"execute", "script":script}, req, res);
});

// Execute async script
app.post("/wd/hub/session/:sessionId/execute_async", function (req, res) {
    res.contentType("application/json");
    res.send({status:9, value:"execute_async: Not Implemented"}, 501);
});

// find an element
app.post("/wd/hub/session/:sessionId/element", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"element", "using":req.body.using, "value":req.body.value}, req, res);
});

// find an element starting from
app.post("/wd/hub/session/:sessionId/element/:id/element", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"element", "element":req.params.id, "using":req.body.using, "value":req.body.value}, req, res);
});

// find elements
app.post("/wd/hub/session/:sessionId/elements", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"elements", "using":req.body.using, "value":req.body.value}, req, res);
});

// find elements starting from
app.post("/wd/hub/session/:sessionId/elements/:id/element", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"elements", "element":req.params.id, "using":req.body.using, "value":req.body.value}, req, res);
});

// get text of an element
app.get("/wd/hub/session/:sessionId/element/:id/text", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"text", "element":req.params.id}, req, res);
});

// get tag of an element
app.get("/wd/hub/session/:sessionId/element/:id/name", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"name", "element":req.params.id}, req, res);
});

// get attribute of an element
app.get("/wd/hub/session/:sessionId/element/:id/attribute/:name", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"attribute", "element":req.params.id, "name":req.params.name}, req, res);
});

// click on an element
app.post("/wd/hub/session/:sessionId/element/:id/click", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"click", "element":req.params.id}, req, res);
});

// submit a form
app.post("/wd/hub/session/:sessionId/element/:id/submit", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"submit", "element":req.params.id}, req, res);
});

// send key strokes to an element
app.post("/wd/hub/session/:sessionId/element/:id/value", function (req, res) {
    res.contentType("application/json");
    if (!validateSession(req, res)) {
        return;
    }

    queueWdTask({"type":"value", "element":req.params.id, "value":req.body.value}, req, res);
});

function serveRevProxy(req, res) {
    var options,
        proxy_request;

    if (debug) {
        console.log("Reverse proxy is serving: http://" + revProxyHost + ":" + revProxyPort + req.url);
    }

    req.headers["X-Forwarded-For"] = req.connection.remoteAddress;
    req.headers["Host"] = revProxyHost;
    options = {
        host:revProxyHost,
        port:revProxyPort,
        path:req.url,
        method:req.method,
        headers:req.headers
    };
    proxy_request = http.request(options, function (proxy_response) {
        //send headers and data as received
        res.writeHead(proxy_response.statusCode, proxy_response.headers);
        proxy_response.addListener("data", function (chunk) {
            res.write(chunk);
        });
        proxy_response.addListener("end", function () {
            res.end();
        });
    });
    //deal with errors, timeout, con refused, ...
    proxy_request.on("error", function (err) {
        res.writeHead(500);
        res.end(err.toString(), "utf-8");
    });

    //proxies to SEND request to the real server
    req.addListener("data", function (chunk) {
        proxy_request.write(chunk);
    });
    req.addListener("end", function () {
        proxy_request.end();
    });
}

// default handling
app.get("*", function (req, res) {
    var docRoot;

    if (revProxyHost.length > 0) {
        serveRevProxy(req, res);
    } else {
        docRoot = process.cwd();
        if ("/" === docRoot) {
            docRoot = "";
        }
        serveStatic(docRoot + req.url, req, res);
    }
});

function runArrowServer(port) {

    app.listen(port);
    arrowPort = port;
    arrowAddress = "http://" + arrowHost + ":" + port;
    console.log("Server running at: " + arrowAddress);
    fs.writeFileSync(global.appRoot + "/tmp/arrow_server.status", arrowAddress);
}

//starting arrow server
portchecker.getFirstAvailable(arrowPortMin, arrowPortMax, "localhost", function (p, host) {
    if (p === -1) {
        console.log('No free ports found for arrow server on ' + host + ' between ' + arrowPortMin + ' and ' + arrowPortMax);
    } else {
        // console.log('The first free port found for arrow server on ' + host + ' between ' + arrowPortMin + ' and ' + arrowPortMax + ' is ' + p);
        arrowPort = p;
        runArrowServer(p);
    }
});

process.on("uncaughtException", function (err) {
    console.log("Uncaught exception: " + err);
    process.exit();
});
process.on("SIGINT", function () {
    console.log("sigINT caught");
    process.exit();
});
process.on("exit", function (err) {
    cleanUp();
});

