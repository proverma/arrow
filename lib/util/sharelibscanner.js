/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 *
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    fs = require('fs'),
    libvm = require('vm');

var sync = require('async');

var arrowConfig = require('../../config/config');

// global val

var CUSTOM_CONTROLLER_DIR = "controller";
var REGISTE_MODULES_DIR = ["server", "client", "common"];

var CUSTOM_CONTROLLER_META = "custom_controller.json";
var CLIENT_CONFIG_NAME = "client_seed.js";
var SERVER_CONFIG_NAME = "server_seed.js";

var SCAN_MODULES_PREFIX = arrowConfig.scanModulesPrefix || ["martini_", "dev_"];
var SCAN_MODULES_RECURSIVE = arrowConfig.scanModulesRecursive || false;

var scanlibpath = arrowConfig.defaultShareLibPath || path.join(__dirname, "../../");
var shareLibMetaPath = path.normalize(arrowConfig.shareLibMetaPath);
var arrow_server_ipaddr = getArrowServerIPAddr();

var config_client = {};
var config_server = {};
var custom_controller = {};


function getArrowServerIPAddr() {

    var statusfile = path.join(shareLibMetaPath, "arrow_server.status");
    var ip;
    try {
        if (fs.statSync(statusfile).isFile()) {
            var file = fs.readFileSync(statusfile, 'utf8');
            var ipreg = /(http:\/\/(\w+:\w+@)?)?(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?/;
            //      like http://10.82.133.96:10000
            if (file.match(ipreg)) {
                ip = file;
            }
        }
        return ip;
    } catch (e) {
        console.log("Arrow server status does not exist");
    }

}
var contextForRunInContext = libvm.createContext({
    require:require,
    module:require('module'),
    console:{
        log:function () {
        }
    },
    window:{},
    document:{},
    YUI:null
});

function showHelp() {
    console.info("Notes :" + "\n" +
        "        It is recommended to organize your yui modules structure like:" + "\n\n" +
        "         Arrow   \n" +
        "           |   \n" +
        "         martini_lib\n" +
        "              |_____server\n" +
        "              |_____client\n" +
        "              |_____common\n" +
        "              |_____controller\n" +
        "              |_____node_modules\n" +
        "              |_____package.json\n\n" +
        " Arrow will scan all share libs under same dir of this Arrow instance");
}

if (!Array.prototype.contains) {
    Array.prototype.contains = function (obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    }
}

if (typeof String.prototype.supplant !== 'function') {
    String.prototype.supplant = function (o) {
        return this.replace(/{{([^{}]*)}}/g, function (a, b) {
            var r = o[b];
            return typeof r === 'string' ? r : a;
        });
    };
}

//  modules(folder) start with "martini_" or "dev_"

function isRegisteDir(f) {

    for (var i = 0; i < SCAN_MODULES_PREFIX.length; i++) {
        if (f.toString().indexOf(SCAN_MODULES_PREFIX[i]) == 0) return true;
    }
    return false;
}

//registeModulesDir: ["server","client","common"]

function isRegisteModuleDir(f) {
    return REGISTE_MODULES_DIR.contains(f);
}

// modules(folder) is Controller

function isCustomController(f) {
    return f.toString() === CUSTOM_CONTROLLER_DIR;
}


exports.genSeedFile = function (scanFolder, callback) {

    var tmpPath = scanFolder ? scanFolder : scanlibpath;

    tmpPath = Array.isArray(tmpPath) ? tmpPath : [tmpPath];

    var pathForScan = tmpPath.map(function (element) {
        return path.resolve(element);
    });

    if (!pathForScan || pathForScan.length == 0) {
        return showHelp();
    }

    var start = new Date().getTime();

    var doscan = function (scanpath, finishone) {

        var fspath = path.normalize(scanpath);

        console.log('\nStart scan share lib from : ' + fspath);

        try {
            if (!fs.statSync(fspath).isDirectory()) {
                console.log('Please make sure the lib folder ' + fspath + ' exist!');
                showHelp();
                return finishone();
            }
        } catch (e) {
            console.log('Please make sure the lib folder exist');
            showHelp();
            return finishone();
        }

        // if fspath self is martini modules,generate meta info directly
        if (isRegisteDir(path.basename(fspath))) {
            generateMetaData(path.basename(fspath), fspath, function (err, message) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(message);
                    finishone();
                }
            });
        } else { // do scan
            scan(fspath, function (err, message) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(message);
                    finishone();
                }
            });
        }
    }

    sync.forEachSeries(pathForScan, doscan, function () {
            console.log("Total time :" + (new Date().getTime() - start) / 1000 + " s");
            //write modules info
            writeSeedFile(function (err, message) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(message);
                }
                callback();
            })
        }
    );
}

function writeSeedFile(cb) {

    var client_template =
        'if(!YUI){' +
            'YUI_config={' +
            'groups:{{client}}' + '}' +
            '}' + 'else{' +
            'YUI.GlobalConfig = {' +
            'groups:{{client}}' +
            '}}';

    var server_template = 'YUI = YUI ? YUI : require(\'yui\').YUI;' +
        'YUI.GlobalConfig = {' +
        'groups:{{server}}' +
        '}';

    var config = {
        client:JSON.stringify(config_client),
        server:JSON.stringify(config_server)
    }

    fs.writeFileSync(path.join(shareLibMetaPath, CLIENT_CONFIG_NAME), client_template.supplant(config));
    fs.writeFileSync(path.join(shareLibMetaPath, SERVER_CONFIG_NAME), server_template.supplant(config));
    fs.writeFileSync(path.join(shareLibMetaPath, CUSTOM_CONTROLLER_META), JSON.stringify(custom_controller));
    cb(null, "Write modules meta info done!");
}

function initMetaData(libname) {

    var GROUP_ROOT = "";
    // set up for client side base and root

    var GROUP_BASE = arrow_server_ipaddr || "http://localhost:10000"; //to be replace if arrow server not started
    config_client[libname] = {};
    config_client[libname].base = GROUP_BASE + "/arrow/static";
    config_client[libname].root = GROUP_ROOT;
    config_client[libname].modules = {};

    // set up for server side base and root
    GROUP_BASE = "/";

    config_server[libname] = {};
    config_server[libname].base = GROUP_BASE;
    config_server[libname].root = GROUP_ROOT;
    config_server[libname].modules = {};

}


function scan(scanlibpath, cb) {
    // this will scan all folders start with some prefix defined in config
    fs.readdir(scanlibpath, function (err, list) {
        if (err) return cb(err);
        var pending = list.length;
        if (!pending) return cb(null, "empty dir");
        list.forEach(function (f) {
            var file = scanlibpath + '/' + f;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    if (!isRegisteDir(f)) { // recursive scan or not by config
                        if (SCAN_MODULES_RECURSIVE) {
                            scan(file, function (err, message) {
                                if (err) return cb(err);
                                if (!--pending) return cb(null, "Scan folder " + scanlibpath + " done!");
                            });
                        } else {
                            if (!--pending)cb(null, "Scan folder " + scanlibpath + " done!");
                            return;
                        }
                    } else {
                        // first params libname like martini_A ,
                        // seconde params libpath like path/to/martini_A
                        generateMetaData(f, file, function (err, message) {
                            if (err) {
                                cb(err);
                            } else {
                                // generate meta done
                                cb(message);
                                if (!--pending) {
                                    cb(null, "Scan folder " + scanlibpath + " done!");
                                }
                            }
                        });
                    }
                } else {
                    if (!--pending) {
                        cb(null, "Scan folder " + scanlibpath + " done!");
                    }
                }
            });
        });
    });

}


function generateMetaData(libname, libpath, done) {

    initMetaData(libname);

    fs.readdir(libpath, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, "empty dir");
        list.forEach(function (f) {
            var file = libpath + '/' + f;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    //  some rules for registe or no-registe
                    if (isRegisteModuleDir(f)) { // should be server,common,or client folder

                        walk(file, function (err, results) {
                            if (err) {
                                done(err);
                            } else {
                                var affnity = f.toString();
                                if (results && results.length > 0) {
                                    results.forEach(function (fspath) {
                                        var yuimodule = captureYUIModuleDetails(fspath);
                                        if (yuimodule && yuimodule.name) { // for those non-yui js file,these will returen as null
                                            if (affnity == 'common' || affnity == 'server') {
                                                var moduledetail = config_server[libname].modules[yuimodule.name] || {};
                                                moduledetail.path = fspath;
                                                moduledetail.requires = yuimodule.meta.requires || [];
                                                config_server[libname].modules[yuimodule.name] = moduledetail;
                                            }
                                            if (affnity == 'common' || affnity == 'client') {
                                                var moduledetail = config_client[libname].modules[yuimodule.name] || {};
                                                moduledetail.path = fspath;
                                                moduledetail.requires = yuimodule.meta.requires || [];
                                                config_client[libname].modules[yuimodule.name] = moduledetail;
                                            }
                                        }
                                    })
                                }
                                if (!--pending) {
                                    done(null, "-- Processing modules " + libname + " done!");
                                }
                            }
                        });
                    } else if (isCustomController(f)) { // should be controller

                        fs.readdir(file, function (err, list) {
                            if (err) done(err);
                            list.forEach(function (f) {
                                var ctrller = file + '/' + f;
                                fs.stat(ctrller, function (err, stat) {
                                    if (stat && stat.isFile() && f.substr(-3) == '.js') {
                                        custom_controller[f] = {};
                                        custom_controller[f].path = ctrller;
                                    }
                                });
                            });
                            if (!--pending) {
                                done(null, "-- Processing modules " + libname + " done!");
                            }
                        });

                    } else {
                        // for no-register folders like node_modules or others , scan recursive
                        scan(file, function (err, message) {
                            if (err) return done(err);
                            if (!--pending) {
                                return done(null, "-- Processing modules " + libname + " done!");
                            }
                        });
                    }
                } else {
                    if (!--pending) {
                        done(null, "-- Processing modules " + libname + " done!");
                    }
                }
            });
        });
    });
}

function walk(dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (f) {
            var file = dir + '/' + f;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        if (err) return done(err);
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    // generate meta config file
                    if (!(f.substr(-3) == '.js')) { //ignore non-js file
                        if (!--pending) done(null, results);
                        return;
                    }
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};


function captureYUIModuleDetails(filePath) {
    var file,
        yui = {};
    file = fs.readFileSync(filePath, 'utf8');
    // setting up the fake YUI before executing the file
    contextForRunInContext.YUI = {
        ENV:{},
        config:{},
        use:function () {
        },
        add:function (name, fn, version, meta) {
            yui.name = name;
            yui.version = version;
            yui.meta = meta || {};
            if (!yui.meta.requires) {
                yui.meta.requires = [];
            }
        }
    };
    try {
        libvm.runInContext(file, contextForRunInContext, filePath);
    } catch (e) {
        yui = null;
        console.log('failed to parse javascript file ' + filePath + '\n' + e.message, 'error');
    }
    return yui;
}

