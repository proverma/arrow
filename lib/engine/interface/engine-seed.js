/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/**
 * this is interface for container seed
 * users can extend other test container/engine if implement this interface
 */

var isCommonJS = typeof window === "undefined" && typeof exports === "object";
//****************************************
//Patch for IE8 : STARTS
//****************************************

//Avoid `console` errors in browsers that lack a console.
(function() {
    var method,
        noop,
        methods,
        length,
        console;

    noop = function () {};

    methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    length = methods.length;
    if((typeof window !== "undefined") ) {
        console = (window.console = window.console || {});
    } else {
        console = {};
    }

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// handling IE8 scenario, when Object.create is not defnied
if (!Object.create) {
    Object.create = (function() {
        function F() {}

        return function(o) {
            if (arguments.length !== 1) {
                throw new Error('Object.create implementation only accepts one parameter.');
            }
            F.prototype = o;
            return new F();
        };
    })();
}

// handling IE8 scenario, when Object.keys is not defnied
Object.keys = Object.keys || (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
        DontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ],
        DontEnumsLength = DontEnums.length;

    return function (o) {
        var result,
            name,
            i;
        if ((typeof o !== "object") && ((typeof o !== "function") || (o === null))) {
            throw new TypeError("Object.keys called on a non-object");
        }


        result = [];
        for (name in o) {
            if (hasOwnProperty.call(o, name)) {
                result.push(name);
            }

        }

        if (hasDontEnumBug) {
            for (i = 0; i < DontEnumsLength; i = i + 1) {
                if (hasOwnProperty.call(o, DontEnums[i])) {
                    result.push(DontEnums[i]);
                }
            }
        }

        return result;
    };
})();

// handling IE8 scenario, when Array.ForEach is not defnied
if (!Array.prototype.forEach) {
    var i;
    Array.prototype.forEach = function(fn, scope) {
        for (i = 0, len = this.length; i < len; i = i + 1) {
            fn.call(scope, this[i], i, this);
        }
    };
}

//****************************************
//Patch for IE8 : ENDS
//****************************************

/**
 * @constructor
 * @param config
 */
function engineSeed(config) {
    this.config = config || {};
    if (!ARROW) {
        ARROW = {};
    }
}

/**
 * capture console in browser side
 */
engineSeed.prototype.captureConsoleMessages = function () {


    try {
        if (console) {
            //Making sure we dont redefine console methods
            if (!console.oldLog) {

                //capturing console log
                console.oldLog = console.log;
                console.log = function (line) {
                    ARROW.consoleLog += "[LOG] " + line + "\n";
                    console.oldLog(line);
                };

                //capturing console info
                console.oldInfo = console.info;
                console.info = function (line) {
                    ARROW.consoleLog += "[INFO] " + line + "\n";
                    console.oldInfo(line);
                };

                //capturing console warn
                console.oldWarn = console.warn;
                console.warn = function (line) {
                    ARROW.consoleLog += "[WARN] " + line + "\n";
                    console.oldWarn(line);
                };

                //capturing console debug
                console.oldDebug = console.debug;
                console.debug = function (line) {
                    ARROW.consoleLog += "[DEBUG] " + line + "\n";
                    console.oldDebug(line);
                };

                //capturing console debug
                console.oldError = console.error;
                console.error = function (line) {
                    ARROW.consoleLog += "[ERROR] " + line + "\n";
                    console.oldError(line);
                };
            }
        }
    } catch (e) {

    }

    // try to catch unhandled errors
    if ((typeof window !== "undefined") && !window.onerror) {
        window.onerror = function (errorMsg, sourceUrl, lineNumber) {
            try {
                if (console) {
                    console.log("javascript error: " + errorMsg + " at " + lineNumber + ", url: " + sourceUrl);
                }
            } catch (e) {
            }
            return true;
        };
    }
};

/**
 * load script for browser side
 * @param url url to load
 * @param callback callback if src loaded
 */
engineSeed.prototype.loadScript = function (url, callback) {
    function injectScript(item, finish) {
        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState) { // IE
            script.onreadystatechange = function () {
                if (("loaded" === script.readyState) || ("complete" === script.readyState)) {
                    script.onreadystatechange = null;
                    finish();
                }
            };
        } else { // Others
            script.onload = function () {
                finish();
            };
        }
        script.src = item;
        document.body.appendChild(script);
    }

    if (typeof url === 'string') {  // one single url,support comma seperator
        url = url.split(',');
    }

    url = [].concat(url);   // with url, we can load multiple script like [yui.js,chai.js]

    function asyncForEach(array, fn, done) {
        var completed = 0;

        if (array.length === 0) {
            done(); // done immediately
        }
        var len = array.length;
        for (var i = 0; i < len; i++) {
            fn(array[i], function () {
                completed++;
                if (completed === array.length) {
                    done();
                }
            });
        }
    };

    asyncForEach(url, injectScript, callback);
};

/**
 * interface for generate server side seed ,must be implemented in instance
 * @param callback
 */
engineSeed.prototype.generateServerSideSeed = function (callback) {
    if (console) {
        console.error("generate Server Side Seed must be implemented by engines");
    }
    callback();
};

/**
 * interface for generate client side seed ,must be implemented in instance
 * @param callback
 */
engineSeed.prototype.generateClientSideSeed = function (callback) {
    if (console) {
        console.error("generate Client Side Seed must be implemented by engines");
    }
    callback();
};

/**
 * must be called in engine's seed,then it will genereate seed for server/client side
 */
engineSeed.prototype.run = function () {

    var self = this;
    if (isCommonJS) {
        var EngineUtil = require('../../util/EngineUtil');
        //server side default we will give a yui seed
        try {
            YUI = require("yui").YUI;
        }
        catch(e) {
            var engineUtil = new EngineUtil();
            engineUtil.handleYUIRequireError(e);
        }

        if (ARROW.shareLibServerSeed !== undefined) {
            try {
                require(ARROW.shareLibServerSeed);
            } catch (e) {
                if (console) {
                    console.error("share lib server side seed cannot be injected");
                }
            }
        }

        self.generateServerSideSeed(function () {
                ARROW.onSeeded();
            }
        );

    } else {
        // client side seed;
        ARROW.consoleLog = "";
        self.captureConsoleMessages();

        function onyuiready() {
            self.generateClientSideSeed(function () {
                    ARROW.onSeeded();
                }
            );
        }

//        dont load any seed file
        self.loadScript(ARROW.appSeed, onyuiready);
    }
};

if (isCommonJS) {
    module.exports.engineSeed = engineSeed;
} else {
    window.engineSeed = engineSeed;
}
