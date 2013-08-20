/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// @HACK: We really should just replace this entire engine with browserify so we can run node-style code client-side.
// https://github.com/substack/node-browserify

/**
 * Mocha Seed Source Generation
 *
 * Basic Explanation:
 * 1. Read Chai and Mocha Source Code from node_modules
 * 2. Encase our seed code in closure
 * 3. Concatenate code into one giant string (use .toString() on the seed code) and export it!
 */

var fs = require('fs'),
    nodeModulesDir = global.appRoot + '/node_modules/',
    mochaPath = nodeModulesDir + '/mocha/mocha.js',
    chaiPath = nodeModulesDir + '/chai/chai.js',
    chaiSrc, mochaSrc, seedSrc;

/**
 * Chai Source Code - Read from node_modules
 */
chaiSrc = fs.readFileSync(chaiPath);

/**
 * Chai Source Code - Read from node_modules
 */
mochaSrc = fs.readFileSync(mochaPath);

/**
 * Seed Source Code - This is exported to the testing environment verbatim.
 */
seedSrc = function() {
    var isCommonJS = typeof window === "undefined" && typeof exports === "object",
        seed = isCommonJS ? require('../interface/engine-seed').engineSeed : window.engineSeed;

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
            DEFAULT_UI = "bdd",
            configs, m_config, i,
            createDiv;

        createDiv = function(text) {
            var div = document.createElement("div");
            div.id = text;
            div.innerHTML = text;
            document.body.appendChild(div);
        };

        createDiv("mocha");

        if (!self.config.ui) {
            self.config.ui = DEFAULT_UI;  // ui is necessary
        }

        m_config = self.config;
        configs = Object.keys(m_config);

        for (i = 0; i < configs.length; i = i + 1) {
            if (typeof mocha[configs[i]] !== "function") {
                delete m_config[configs[i]];
            }
        }

        mocha.setup(m_config);
        cb();
    };

    new mochaSeed(ARROW.engineConfig).run();
};

// Export our page seed code
module.exports = mochaSrc + ';' + chaiSrc + ';' + '(' + seedSrc.toString() + ')();';
