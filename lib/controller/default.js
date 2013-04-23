/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var util = require("util");
var log4js = require("log4js");
var Controller = require("../interface/controller");
var Arrow = require("../interface/arrow");

/**
 * Default controller example:
 *
 * Open page and test
 * "test_name" : {
 *     "params": {
 *         "page": "http://www.foo.com/app",
 *         "test": "test-func.js",
 *         "lib": "test-lib.js" // optional
 *     }
 * }
 *
 * Scenario
 * "scenario_test": {
 *     "params": {
 *         "scenario": [ // scenario is a sequence of atoms
 *             {
 *                 "page": "http://www.foo.com/app" // this atom uses the default controller
 *             },
 *             {
 *                  "controller": "custom_controller",
 *                  "params": {
 *                      // controller specific parameter
 *                  }
 *             },
 *             {
 *                  "test": "test-quote.js" // this atom uses the default controller
 *             }
 *         ]
 *     }
 *
 * @param testConfig values from the config section in the descriptor ycb
 * @param testParams values from the params section in the test
 * @param driver instance
 *
 */
function DefaultController(testConfig, testParams, driver) {
    Controller.call(this, testConfig, testParams, driver);
    this.logger = log4js.getLogger("DefaultController");
}

util.inherits(DefaultController, Controller);

/**
 * Handles scenario execution
 * @private
 *
 * @param callback function to call when done. It receives errorMsg as a parameter.
 */
DefaultController.prototype.executeScenario = function (callback) {
    var self = this,
        arrow = Arrow.getInstance(),
        scenario = this.testParams.scenario,
        childParams,
        index = 0;

    // private function to sequenece atoms inside a scenario
    function runNextChild() {
        var child,
            controllerName,
            childLib;

        if (index === scenario.length) {
            callback();
            return;
        }

        child = scenario[index];
        index += 1;

        // In an atom, "controller" and "params" are required with the exception of the default
        // controller; in which case all the direct children of the atom are treates as "params".
        controllerName = child["controller"];
        childParams = child.params;
        if (!childParams) {
            if (!controllerName) {
                childParams = child;
            } else {
                childParams = {};
            }
        }

        childLib = childParams.lib;
        if (childLib) {
            if (self.testParams.lib) { childLib = self.testParams.lib + "," + childLib; }
        } else {
            childLib = self.testParams.lib;
        }
        childParams.lib = childLib;

        // pass testParams.shared down to child
        if (self.testParams.shared) {
            childParams.shared = self.testParams.shared;
        } else {
            childParams.shared = {};
        }

        // TODO: add to the controllers report success or failure
        arrow.runController(controllerName, self.testConfig, childParams, self.driver, function (error) {
            if (error) {
                var errorMsg = "Scenario failed at atom: " + (index - 1);
                callback(errorMsg);
            } else {
                // save share params back to testParams
                if (childParams.shared) {
                    self.testParams.shared = childParams.shared;
                }

                runNextChild();
            }
        });
    }

    // initiate the sequence
    runNextChild();
};

/**
 * Default controller that opens a page and tests. It also handles scenario 
 * execution if given.
 *
 * @param callback function to call when done. It receives errorMsg as a parameter.
 */
DefaultController.prototype.execute = function (callback) {
    var self = this;
    if (self.testParams.scenario) {
        self.executeScenario(callback);
    } else if (self.testParams.action) {
        self.driver.executeAction(self.testConfig, self.testParams, callback);
    } else {
        if (!self.testParams.test && self.testParams.page) {
            self.driver.navigate(self.testParams.page, callback);
        } else if (self.testParams.test) {
            self.driver.executeTest(self.testConfig, self.testParams, callback);
        } else {
            callback("Neither test nor page is specified");
        }
    }
};

module.exports = DefaultController;

