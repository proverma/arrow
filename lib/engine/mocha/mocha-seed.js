/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window === "undefined" && typeof exports === "object";
var seed = isCommonJS ? require('../interface/engine-seed').engineSeed : window.engineSeed;

/**
 * @constructor
 * @param config
 */
function mochaSeed(config) {
    this.config = config || {};
    seed.call(this, config);
}

mochaSeed.prototype = Object.create(seed.prototype);

/**
 * mocha generate server side seed
 * just require node package and load the test file/libs
 * @param cb
 */
mochaSeed.prototype.generateServerSideSeed = function (cb) {

    var Mocha = require('mocha'),
        DEFAULT_UI = "bdd",
        DEFAULT_ASSERTION = "chai",
        mods;

    mocha = new Mocha(this.config);

    // set up ui
    if (!this.config.ui) {
        mocha.ui(DEFAULT_UI);// ui is necessary
    }
    // load all files
    ARROW.testLibs.forEach(function (item) {
        mocha.addFile(item);
    });
    mocha.addFile(ARROW.testfile);
    mocha.loadFiles();

    // default have "should support" in server side
    require(DEFAULT_ASSERTION);
    if (this.config.require) {
        mods = this.config.require;
        mods = Array.isArray(mods) ? mods : [mods];
        mods.forEach(function (item) {
            try {
                require(item);
            } catch (e) {
                if (console) {
                    console.error(e);
                }
            }
        });
    }
    cb();
};

/**
 * mocha generate client side seed
 * for now load mocha.js from ydn.zenfs.com
 * @param cb
 */
mochaSeed.prototype.generateClientSideSeed = function (cb) {

    var self = this,
        MOCHA_LINK = "https://raw.github.com/visionmedia/mocha/1.8.1/mocha.js",
        DEFAULT_UI = "bdd",
    // chai is default supported and we will use official url
        DEFAULT_ASSERTION = {
            "chai": "http://chaijs.com/chai.js",
            "expect": "https://raw.github.com/LearnBoost/expect.js/0.2.0/expect.js"
        },
        mods;

    function createDiv(text) {
        var div = document.createElement("div");
        div.id = text;
        div.innerHTML = text;
        document.body.appendChild(div);
    }

    createDiv("mocha");

    // check the given item is good enough for load,for example:
    // if given require:"chai" ,we default load http://chaijs.com/chai.js
    // if given require:"should", we just load(require it) in server side
    // if given a url http://******/**.js we load it too.

    function onRequireReady() {
        // load mocha
        self.loadScript(MOCHA_LINK, function () {
            if (!self.config.ui) {
                self.config.ui = DEFAULT_UI;  // ui is necessary
            }
            var m_config = self.config,
                configs = Object.keys(m_config),
                i;
            for (i = 0; i < configs.length; i = i + 1) {
                if (typeof mocha[configs[i]] !== "function") {
                    delete m_config[configs[i]];
                }
            }
            mocha.setup(m_config);
            cb();
        });
    }

    // deal with require
    if (self.config.require) {

        var canBeLoadInClient = function (item) {
                var url = null, i, ipreg,
                    assertions = Object.keys(DEFAULT_ASSERTION);
                for (i = 0; i < assertions.length; i = i + 1) {
                    if (assertions[i] === item || DEFAULT_ASSERTION[assertions[i]] === item) {
                        url = DEFAULT_ASSERTION[assertions[i]];
                    }
                }
                if (url !== null) {
                    return url;
                }
                ipreg = /^((http|https):\/\/)((.*?):(.*?)@)?(.*\.js$)/;
                if (ipreg.test(item)) {
                    url = item;
                }
                return url;
            },

            asyncForEach = function (array, fn, callback) {
                var completed = 0, i, len;

                if (array.length === 0) {
                    callback(); // done immediately
                }
                len = array.length;
                for (i = 0; i < len; i = i + 1) {
                    fn(array[i], function () {
                        completed = completed + 1;
                        if (completed === array.length) {
                            callback();
                        }
                    });
                }
            };

        mods = self.config.require;
        mods = Array.isArray(mods) ? mods : [mods];

        asyncForEach(mods, function (el, callback) {
            var url = canBeLoadInClient(el),
                loaded = false;
            if (url !== null) {
                self.loadScript(url, function () {
                    loaded = true;
                    callback();
                });
                // make sure run callback no matter if external source is loaded;
                setTimeout(function () {
                    if (!loaded) {
                        if (console) {
                            console.warn("please check if your require url: " + url + " is available");
                        }
                        callback();
                    }
                }, 5000);

            } else {
                callback();
            }
        }, function () {
            onRequireReady();
        });

    } else {
        onRequireReady();
    }
};

new mochaSeed(ARROW.engineConfig).run();

