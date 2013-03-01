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

var SHARE_LIB_CONTROLLER_DIR = "controller";
var SHARE_LIB_YUILIB_DIR = "lib";
var SHARE_LIB_MODULES_DIR = ["server", "client", "common"];

var CUSTOM_CONTROLLER_META = "custom_controller.json";
var CLIENT_CONFIG_NAME = arrowConfig.clientConfigName || "client_seed.js";
var SERVER_CONFIG_NAME = arrowConfig.serverConfigName || "server_seed.js";

var SHARE_LIB_DIR_PREFIX = arrowConfig.scanModulesPrefix || [];
var SHARE_LIB_SCAN_RECURSIVE = arrowConfig.scanModulesRecursive || false;
var BUILD_IN_SHARE_LIB_PATH = path.join(arrowConfig.arrowModuleRoot, "sharelib");

var scanlibpath = arrowConfig.defaultShareLibPath || path.join(__dirname, "../../");
var shareLibMetaPath = path.join(arrowConfig.arrowModuleRoot, "tmp");
var arrowServerHost = getArrowServerHost();

var config_client;
var config_server;
var custom_controller;

/**
 * scan given path for all sharelib moudules and controllers
 * @constructor
 */
function sharelibscanner() {
    this.logger = log4js.getLogger("sharelibScanner");
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
        "        It is required to organize your martini modules structure like:" + "\n\n" +
        "         Arrow   \n" +
        "           |   \n" +
        "         martini_lib/\n" +
        "              |_____controller/\n" +
        "                 |_____martini-controller.js\n" +
        "              |_____lib/\n" +
        "                 |_____server/\n" +
        "                 |_____client/\n" +
        "                 |_____common/\n" +
        "              |_____node_modules/\n" +
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
 * that 's modules(folder) start with "martini_"  or is just build-in lib : arrow/sharelib/
 * @param fspath file(folder) path
 * @return {Boolean}
 */
function isShareLib(fspath) {
    if (path.normalize(fspath) == path.normalize(BUILD_IN_SHARE_LIB_PATH))return true;
    if(SHARE_LIB_DIR_PREFIX.length==0)return true;  // if no prefix ,then we treat it as sharelib
    var dirname = path.basename(fspath);
    for (var i = 0; i < SHARE_LIB_DIR_PREFIX.length; i++) {
        if (dirname.toString().indexOf(SHARE_LIB_DIR_PREFIX[i]) == 0) return true;
    }
    return false;
}


/**
 * check if given folder is sharelib/lib  or martini_xxx/lib
 * @param f file(folder) name
 * @return {Boolean}
 */
function isShareLibYUILib(f) {
    return f.toString() === SHARE_LIB_YUILIB_DIR;
}

/**
 * check if given folder is Controller
 * @param f file(folder) name
 * @return {Boolean}
 */
function isShareLibController(f) {
    return f.toString() === SHARE_LIB_CONTROLLER_DIR;
}


/**
 * check if given folder is Controller
 * @param f file(folder) name
 * @return {Boolean}
 */
function isShareLibBuildInController(fspath) {
    return path.normalize(fspath) == path.join(BUILD_IN_SHARE_LIB_PATH, SHARE_LIB_CONTROLLER_DIR);
}

/**
 * check if given folder name matches these Modules Dir: ["server","client","common"]
 * @param f file(folder) name
 * @return {Boolean}
 */
function isShareLibYUIModule(f) {
    var i = SHARE_LIB_MODULES_DIR.length;
    while (i--) {
        if (SHARE_LIB_MODULES_DIR[i] === f) {
            return true;
        }
    }
    return false;
}


/**
 * check if given folder is hidden
 * @param f
 */
function isHiddenFile(f) {
    return /^\./.test(f);
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

    tmpPath.unshift(BUILD_IN_SHARE_LIB_PATH);

    var pathForScan = tmpPath.map(function (element) {
        return path.resolve(element);
    });

    if (!pathForScan || pathForScan.length == 0) {
        return showHelp();
    }

    var start = new Date().getTime();

    var self = this;

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

        // if fspath self is sharelib modules,generate meta info directly
        if (isShareLib(fspath)) {
            generateMetaData(path.basename(fspath), fspath, function (e, message) {
                if (e) {
                    self.logger.info(e);
                } else {
                    self.logger.info(message);
                    finishone();
                }
            });
        } else { // do scan
            scan(fspath, function (e, message) {
                if (e) {
                    self.logger.info(e);
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
                    self.logger.error(err);
                } else {
                    self.logger.debug("-- Sharelib meta info:");
                    self.logger.debug(JSON.stringify(config_client));
                    self.logger.debug(JSON.stringify(config_server));
                    self.logger.info(message);
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

    //cleanup config to remove those have empty modules info
    var removeEmptyModulesOfConfig = function (config) {
        for (var key in config) {
            if (config.hasOwnProperty(key) &&
                config[key]['modules'] &&
                Object.keys(config[key]['modules']).length === 0) {
                delete config[key];
            }
        }
    }

    var client_template =
        'var SCANNED_YUI_GROUP=%client%;' +
            'if(!YUI){' +
            'YUI_config={' +
            'groups:SCANNED_YUI_GROUP' + '}' +
            '}' + 'else{' +
            'YUI.GlobalConfig = {' +
            'groups:SCANNED_YUI_GROUP' +
            '}}';

    var server_template = 'YUI = YUI ? YUI : require(\'yui\').YUI;' +
        'YUI.GlobalConfig = {' +
        'groups:%server%' +
        '}';

    removeEmptyModulesOfConfig(config_client);
    removeEmptyModulesOfConfig(config_server);

    fs.writeFileSync(path.join(shareLibMetaPath, CLIENT_CONFIG_NAME), client_template.replace(/%client%/g, JSON.stringify(config_client)));
    fs.writeFileSync(path.join(shareLibMetaPath, SERVER_CONFIG_NAME), server_template.replace(/%server%/g, JSON.stringify(config_server)));
    fs.writeFileSync(path.join(shareLibMetaPath, CUSTOM_CONTROLLER_META), JSON.stringify(custom_controller));

    cb(null, "Write sharelib modules meta done!");
}

/**
 * init meta data for scan
 * @param libname libname start with martini_
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
            fs.stat(file, function (err, stat) {   // enable soft link
                if (stat && stat.isDirectory() && !isHiddenFile(f)) {
                    if (!isShareLib(file)) { // recursive scan or not by config
                        if (SHARE_LIB_SCAN_RECURSIVE) {
                            scan(file, function (err, message) {
                                if (err) return cb(err);
                                if (!--pending) return cb(null, "Scan folder " + scanlibpath + " done!");
                            });
                        } else {
                            if (!--pending) cb(null, "Scan folder " + scanlibpath + " done!");
                            return;
                        }
                    } else {
                        // first params libname like martini_A ,
                        // seconde params libpath like path/to/martini_A
                        generateMetaData(f, file, function (err, message) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(message);
                                if (!--pending) {
                                    return cb(null, "Scan folder " + scanlibpath + " done!");
                                }
                            }
                        });
                    }
                } else {
                    if (!--pending) {
                        return cb(null, "Scan folder " + scanlibpath + " done!");
                    }
                }
            });
        });
    });

}

/**
 * generate meta data for a martini_ packages or build-in arrow/sharelib
 * @param libname
 * @param libpath
 * @param done
 */
function generateMetaData(libname, libpath, done) {

    var libhash = calcLibHashByFsPath(libpath);
    if (libhash) {
        libhash = libhash.substring(0, 6); //six digits of MD5 hash is enough
    }

    initMetaData(libhash);

    fs.readdir(libpath, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, "empty dir");
        list.forEach(function (f) {
            var file = libpath + '/' + f;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory() && !isHiddenFile(f)) {
                    if (isShareLibYUILib(f)) {  // should be "lib" foder
                        generateYUIGroupsInfo(libhash, file, function (err, message) {
                            if (err) {
                                done(err);
                            } else {
                                if (!--pending) {
                                    return done(null, "-- Processing modules " + libpath + " done!");
                                }
                            }
                        });
                    } else if (isShareLibController(f)) { // should be "controller" folder
                        generateControllersInfo(libname, file, function (err, message) {
                                if (err) {
                                    done(err);
                                } else {
                                    if (!--pending) {
                                        return done(null, "-- Processing modules " + libpath + " done!");
                                    }
                                }
                            }
                        );
                    } else if (f.toString() === "node_modules") {
                    // for other folders like "node_modules" or others , scan recursive for martini_
                        scan(file, function (err, message) {
                            if (err) return done(err);
                            if (!--pending) {
                                return done(null, "-- Processing modules " + libpath + " done!");
                            }
                        });
                    } else { // custom dirs like src/test ,do scan recursive
                        generateMetaData(f, file, function (err, message) {
                            if (err) return done(err);
                            if (!--pending) {
                                return done(null, "-- Processing modules " + libpath + " done!");
                            }
                        });
                    }
                } else {
                    if (!--pending) {
                        return done(null, "-- Processing modules " + libpath + " done!");
                    }
                }
            });
        });
    });
}


/**
 * generate meta data for a martini_ modules or build-in sharelib
 * @param libname
 * @param libpath
 * @param done
 */
function generateYUIGroupsInfo(libhash, libpath, done) {

    fs.readdir(libpath, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, "empty dir");
        list.forEach(function (f) {
            var file = libpath + '/' + f;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory() && !isHiddenFile(f)) {

                    // NOTE:
                    // it should be "server","common",or "client" folder
                    // for these folders that don't match client/server/common will be ignored
                    // its strongly recommonded that users orgnize all yui file in client/server/common way to avoid mistakes

                    if (!isShareLibYUIModule(f)) {
                        if (!--pending)return done(null, "-- Processing yui lib " + libpath + " done!");
                        return;
                    }
                    walk(file, function (err, results) {
                        if (err) {
                            return done(err);
                        } else {
                            var affnity = f.toString();
                            if (results && results.length > 0) {
                                results.forEach(function (fspath) {
                                    var yuimodule = captureYUIModuleDetails(fspath);
                                    if (yuimodule && yuimodule.name) { // for those non-yui js file, will returen as null
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
                                return done(null, "-- Processing yui lib " + libpath + " done!");
                            }
                        }
                    });
                } else {
                    if (!--pending) {
                        return done(null, "-- Processing yui lib " + libpath + " done!");
                    }
                }
            });
        });
    });
}

/**
 * generate meta data of controller under a martini_ pkg or build-in sharelib
 * @param libname pkg name
 * @param file controller folder path
 * @param done
 */
function generateControllersInfo(libname, file, done) {
    var ctrller_name;
    fs.readdir(file, function (err, list) {
        if (err) return done(err);
        list.forEach(function (f) {
            var ctrller = file + '/' + f;
            fs.stat(ctrller, function (err, stat) {
                if (stat && stat.isFile() && f.substr(-3) == '.js') {
                    ctrller_name = libname + "." + f.substr(0, f.lastIndexOf('.'));
                    // note: if is build-in share-lib controller,then users can use them without a package name
                    if (isShareLibBuildInController(file)) {
                        ctrller_name = f.substr(0, f.lastIndexOf('.'));
                    }
                    custom_controller[ctrller_name] = custom_controller[ctrller_name] || {};
                    custom_controller[ctrller_name].path = ctrller;

                    // TODO: maybe we should test if this controller can require arrow corrently
                }
            });
        });
        return done(null, "Generate controller info done");
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
                    if (isHiddenFile(f)) {
                        if (!--pending) done(null, results);
                        return;
                    }
                    walk(file, function (err, res) {
                        if (err) return done(err);
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    // generate meta config file
                    if (!(f.substr(-3) == '.js') || isHiddenFile(f)) { //ignore non-js file
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
        console.error('Failed to parse javascript(YUI) file: ' + filePath + '\n' + e.message, 'error');
    }
    return yui;
}

module.exports = sharelibscanner;
