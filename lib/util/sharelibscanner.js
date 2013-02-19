/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 *
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    fs = require('fs'),
    libvm = require('vm');


var fse = require('fs-extra');

var arrowConfig = require('../../config/config');

// global val

var config_client = {};
var config_server = {};


var scanlibpath = path.normalize(arrowConfig.defaultShareLibPath) || path.join(__dirname, "../../");

var shareLibMetaPath = path.normalize(arrowConfig.shareLibMetaPath);
var arrow_server_ipaddr = getArrowServerIPAddr();


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
    require: require,
    module: require('module'),
    console: {
        log: function () {}
    },
    window: {},
    document: {},
    YUI: null
});


function showHelp() {
    console.info("Notes :" + "\n" +
        "        It is recommended to organize your yui modules structure like:" + "\n\n" +
        "         Arrow   " +
        "           |   " +
        "         martini_lib\n" +
        "              |_____server\n" +
        "              |_____client\n" +
        "              |_____common\n" +
        "              |_____package.json\n\n" +
        " Arrow will scan all share libs under sanme dir of this Arrow instance");
}


function doScan() {

    var pathForScan = scanlibpath;

    if (!pathForScan) {
        showHelp();
        process.exit(1);
    }
    try {
        if (!fs.statSync(pathForScan).isDirectory()) {
            console.log('Please make sure the lib folder exist');
            showHelp();
            process.exit(2);
        }
    } catch (e) {
        console.log('Please make sure the lib folder exist');
        showHelp();
        process.exit(2);
    }
    var start = new Date().getTime();

    scan(pathForScan, function (err, message) {
        if (err) {
            console.log(err);
        } else {
            console.log(message + " Total time :" + (new Date().getTime() - start) / 1000 + " s");
            //write back modules info
            writeModuleInfo(function (er, message) {
                if (er) {
                    console.log(err);
                } else {
                    console.log(message);
                }
            })
        }
    });
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


function isIgnoreScanDir(f) {
    return arrowConfig.ignoreScan.contains(f) || !f.toString().indexOf("martini") == 0;
}


function isRegisteDir(f) {
    return arrowConfig.registeDir.contains(f);
}

function writeModuleInfo(cb) {

    fse.jsonfile.writeFile(path.join(shareLibMetaPath, "config_client.json"), config_client, function (err) {
        if (err) cb(err);
        fse.jsonfile.writeFile(path.join(shareLibMetaPath, "config_server.json"), config_server, function (err) {
            if (err) cb(err);
            else cb(null, "Write modules meta info in " + path.normalize(shareLibMetaPath));
        })
    });
}

exports.genSeedFile = function (scanFolder, callback) {

    var pathForScan;
    if (scanFolder !== undefined) {
        pathForScan = process.cwd() + '/' + scanFolder;
    } else {
        pathForScan = scanlibpath;
    }
    console.log('\nStart for path:' + pathForScan);

    if (!pathForScan) {
        showHelp();
        process.exit(1);
    }
    try {
        if (!fs.statSync(pathForScan).isDirectory()) {
            console.log('Please make sure the lib folder exist');
            showHelp();
            process.exit(2);
        }
    } catch (e) {
        console.log('Please make sure the lib folder exist');
        showHelp();
        process.exit(2);
    }

    var start = new Date().getTime();
    scan(pathForScan, function (err, message) {
        if (err) {
            console.log(err);
        } else {
            console.log(message + " Total time :" + (new Date().getTime() - start) / 1000 + " s");
            //write back modules info
            writeSeedFile(function (err, message) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(message);
                }
                callback();
            })
        }
    });
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
        client: JSON.stringify(config_client),
        server: JSON.stringify(config_server)
    }

    fs.writeFileSync(path.join(shareLibMetaPath, arrowConfig.clientConfigName), client_template.supplant(config));
    fs.writeFileSync(path.join(shareLibMetaPath, arrowConfig.serverConfigName), server_template.supplant(config));
    cb();
}

function prepareScan(libname) {

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

    // scan these libs,
    // according to some rules , will ignore some folder

    fs.readdir(scanlibpath, function (err, list) {
        if (err) return cb(err);
        var pending = list.length;
        if (!pending) return cb(null, "empty dir");
        list.forEach(function (f) {
            var file = scanlibpath + '/' + f;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    //  some rules for registe or no-registe
                    if (isIgnoreScanDir(f)) {
                        if (!--pending) cb(null, "Scan folder " + scanlibpath + " done!");
                        return;
                    }
                    var libname = f;
                    var libpath = file;

                    prepareScan(libname);

                    generateMetaData(libname, libpath, function (err, message) {
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

    fs.readdir(libpath, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, "empty dir");
        list.forEach(function (f) {
            var file = libpath + '/' + f;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {

                    //  some rules for registe or no-registe
                    if (!isRegisteDir(f)) {
                        if (!--pending) done(null, "Processing modules " + libname + " done!");
                        return;
                    }
                    walk(file, function (err, results) {
                        if (err) {
                            done(err);
                        } else {
                            var affnity = path.basename(file); // should be server,common,or client
                            if (results && results.length > 0) {
                                results.forEach(function (fspath) {
                                    var yuimodule = captureYUIModuleDetails(fspath);
                                    if (yuimodule && yuimodule.name) { // for those non-yui js file,these will returen as null
                                        if (affnity == 'common' || affnity == 'server') {
                                            var moduledetail = config_server[libname].modules[yuimodule.name] || {};
                                            //moduledetail.fullpath = fspath;
                                            moduledetail.path = fspath;
                                            moduledetail.requires = yuimodule.meta.requires || [];
                                            config_server[libname].modules[yuimodule.name] = moduledetail;
                                        }
                                        if (affnity == 'common' || affnity == 'client') {
                                            var moduledetail = config_client[libname].modules[yuimodule.name] || {};
                                            //moduledetail.fullpath = fspath;
                                            moduledetail.path = fspath;
                                            moduledetail.requires = yuimodule.meta.requires || [];
                                            config_client[libname].modules[yuimodule.name] = moduledetail;
                                        }
                                    }
                                })
                            }

                            if (!--pending) {
                                done(null, "Processing modules " + libname + " done!");
                            }
                        }
                    });
                } else {
                    if (!--pending) {
                        done(null, "Processing modules " + libname + " done!");
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
        ENV: {},
        config: {},
        use: function () {},
        add: function (name, fn, version, meta) {
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

