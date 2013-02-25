/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 *
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    fs = require('fs'),
    libvm = require('vm'),
    crypto = require('crypto');

var sync = require('async');
var log4js = require("log4js");

var arrowConfig = require('../../config/config');

// global val

var CUSTOM_CONTROLLER_DIR = "controller";
var SHARE_LIB_MODULES_DIR = ["server", "client", "common"];

var CUSTOM_CONTROLLER_META = "custom_controller.json";
var CLIENT_CONFIG_NAME = arrowConfig.clientConfigName || "client_seed.js";
var SERVER_CONFIG_NAME = arrowConfig.serverConfigName || "server_seed.js";

var SHARE_LIB_DIR_PREFIX = arrowConfig.scanModulesPrefix || ["martini_", "dev_"];
var SHARE_LIB_SCAN_RECURSIVE = arrowConfig.scanModulesRecursive || false;

var scanlibpath = arrowConfig.defaultShareLibPath || path.join(__dirname, "../../");
var shareLibMetaPath = path.join(arrowConfig.arrowModuleRoot ,"tmp");
var arrowServerHost = getArrowServerHost();

var config_client;
var config_server;
var custom_controller;

/**
 * scan given path for all martini/dev moudules and controllers
 * @constructor
 */
function sharelibscanner(){
    this.logger = log4js.getLogger("shareLibScanner");
    config_client = {};
    config_server = {};
    custom_controller = {};
}

/**
 * get ip address from arrow server
 * @return {*}
 */
function getArrowServerHost() {

    var statusfile = path.join(shareLibMetaPath, "arrow_server.status");
    var ip;
    try {
        if (fs.statSync(statusfile).isFile()) {
            var file = fs.readFileSync(statusfile, 'utf8');
            var ipreg = /^((http|https):\/\/)?((.*?):(.*?)@)?([a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])((\.[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])*)(:([0-9]{1,5}))?/;
            //      like http://10.82.133.96:10000 or https://localhost:10000
            if (file.match(ipreg)) {
                ip = file.match(ipreg)[0]; //extract
            }
        }
    } catch (e) {
        console.info("Arrow server status does not exist");
    }
    return ip;
}

/**
 * show help
 */
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

/**
 * calculate Hash By fs Path
 * @param path
 * @return {*}
 */
function calcLibHashByFsPath(path) {
    return  crypto.createHash('md5').update(path).digest("hex");
}


/**
 * check if given file(folder) is share lib ,
 * that 's modules(folder) start with "martini_" or "dev_"
 * @param f file(folder) name
 * @return {Boolean}
 */
function isShareLib(f) {
    for (var i = 0; i < SHARE_LIB_DIR_PREFIX.length; i++) {
        if (f.toString().indexOf(SHARE_LIB_DIR_PREFIX[i]) == 0) return true;
    }
    return false;
}

/**
 * check if given folder name matches these Modules Dir: ["server","client","common"]
 * @param f file(folder) name
 * @return {Boolean}
 */
function isShareLibModule(f) {
    var i = SHARE_LIB_MODULES_DIR.length;
    while (i--) {
        if (SHARE_LIB_MODULES_DIR[i] === f) {
            return true;
        }
    }
    return false;
}

/**
 * check if given folder is Controller
 * @param f file(folder) name
 * @return {Boolean}
 */
function isCustomController(f) {
    return f.toString() === CUSTOM_CONTROLLER_DIR;
}

/**
 * generate both client and server seed files by given scan folder
 * @param scanFolder
 * @param callback
 * @return {*}
 */
sharelibscanner.prototype.genSeedFile = function (scanFolder, callback) {

    var tmpPath = scanFolder || scanlibpath;

    tmpPath = Array.isArray(tmpPath) ? tmpPath : [tmpPath];

    var pathForScan = tmpPath.map(function (element) {
        return path.resolve(element);
    });

    if (!pathForScan || pathForScan.length == 0) {
        return showHelp();
    }

    var start = new Date().getTime();

    var self=this;

    var doscan = function (scanpath, finishone) {

        var fspath = path.normalize(scanpath);

        self.logger.info('Start scan share lib from : ' + fspath);

        try {
            if (!fs.statSync(fspath).isDirectory()) {
                self.logger.error('Please make sure the lib folder ' + fspath + ' exist!');
                showHelp();
                return finishone();
            }
        } catch (e) {
            self.logger.error('Please make sure the lib folder exist');
            showHelp();
            return finishone();
        }

        // if fspath self is martini modules,generate meta info directly
        if (isShareLib(path.basename(fspath))) {
            generateMetaData(path.basename(fspath), fspath, function (err, message) {
                if (err) {
                    self.logger.trace(err);
                } else {
                    self.logger.info(message);
                    finishone();
                }
            });
        } else { // do scan
            scan(fspath, function (err, message) {
                if (err) {
                    self.logger.trace(err);
                } else {
                    self.logger.info(message);
                    finishone();
                }
            });
        }
    }

    sync.forEachSeries(pathForScan, doscan, function () {
            self.logger.info("Total time :" + (new Date().getTime() - start) / 1000 + " s");
            //write modules info
            writeSeedFile(function (err, message) {
                if (err) {
                    self.logger.trace(err);
                } else {
                    self.logger.trace(message);
                }
                callback();
            })
        }
    );
}

/**
 * write seed file and controller info
 * @param cb
 */
function writeSeedFile(cb) {

    var client_template =
        'if(!YUI){' +
            'YUI_config={' +
            'groups:%client%' + '}' +
            '}' + 'else{' +
            'YUI.GlobalConfig = {' +
            'groups:%client%' +
            '}}';

    var server_template = 'YUI = YUI ? YUI : require(\'yui\').YUI;' +
        'YUI.GlobalConfig = {' +
        'groups:%server%' +
        '}';

    var config = {
        client:JSON.stringify(config_client),
        server:JSON.stringify(config_server)
    }

    fs.writeFileSync(path.join(shareLibMetaPath, CLIENT_CONFIG_NAME), client_template.replace(/%client%/g, config.client));
    fs.writeFileSync(path.join(shareLibMetaPath, SERVER_CONFIG_NAME), server_template.replace(/%server%/g, config.server));
    fs.writeFileSync(path.join(shareLibMetaPath, CUSTOM_CONTROLLER_META), JSON.stringify(custom_controller));
    cb(null, "Write modules meta info done!");
}

/**
 * init meta data for scan
 * @param libname libname start with martini_ or dev_
 */
function initMetaData(libname) {

    var GROUP_ROOT = "";
    // set up for client side base and root

    var GROUP_BASE = arrowServerHost || "http://localhost:10000"; //to be replace if arrow server not started
    config_client[libname] = config_client[libname] || {};
    config_client[libname].base = config_client[libname].base || GROUP_BASE + "/arrow/static";
    config_client[libname].root = config_client[libname].root || GROUP_ROOT;
    config_client[libname].modules = config_client[libname].modules || {};

    // set up for server side base and root
    GROUP_BASE = "/";

    config_server[libname] = config_server[libname] || {};
    config_server[libname].base = config_server[libname].base || GROUP_BASE;
    config_server[libname].root = config_server[libname].root || GROUP_ROOT;
    config_server[libname].modules = config_server[libname].modules || {};

}

/**
 * Do scan by given path
 * @param scanlibpath path for scan
 * @param cb
 */
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
                    if (!isShareLib(f)) { // recursive scan or not by config
                        if (SHARE_LIB_SCAN_RECURSIVE) {
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

/**
 * generate meta data for a martini_/dev_ modules
 * @param libname
 * @param libpath
 * @param done
 */
function generateMetaData(libname, libpath, done) {

    var libhash = calcLibHashByFsPath(libpath);

    initMetaData(libhash);

    fs.readdir(libpath, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, "empty dir");
        list.forEach(function (f) {
            var file = libpath + '/' + f;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    //  some rules for registe or no-registe
                    if (isShareLibModule(f)) { // should be server,common,or client folder

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
                                                var moduledetail = config_server[libhash].modules[yuimodule.name] || {};
                                                moduledetail.path = fspath;
                                                moduledetail.requires = yuimodule.meta.requires || [];
                                                config_server[libhash].modules[yuimodule.name] = moduledetail;
                                            }
                                            if (affnity == 'common' || affnity == 'client') {
                                                var moduledetail = config_client[libhash].modules[yuimodule.name] || {};
                                                moduledetail.path = fspath;
                                                moduledetail.requires = yuimodule.meta.requires || [];
                                                config_client[libhash].modules[yuimodule.name] = moduledetail;
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
                                        ctr_name = libname + "." + f.substr(0, f.lastIndexOf('.'));
                                        custom_controller[ctr_name] = custom_controller[ctr_name] || {};
                                        custom_controller[ctr_name].path = ctrller;
                                        // test if this controller can require arrow corrently

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

/**
 * recursively walk the dir to get file list
 * @param dir
 * @param done
 */
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

/**
 * get yui modules details
 * @param filePath file path to js file
 * @return {Object}
 */
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
        console.error('failed to parse javascript file ' + filePath + '\n' + e.message, 'error');
    }
    return yui;
}

module.exports = sharelibscanner;
