/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var log4js = require("log4js");
var path = require("path");
var fs = require("fs");

function Arrow(config, args) {
    this.logger = log4js.getLogger("Arrow");
    this.config = config;
    this.args = args;

    Arrow.instance = this;
}

Arrow.instance = null;
Arrow.getInstance = function () {
    return Arrow.instance;
};

Arrow.prototype.run = function () {
    var SessionFactory = require("../session/sessionfactory"),
        sf;

    sf = new SessionFactory(this.config, this.args);
    sf.runAllTestSessions();
};

Arrow.prototype.runController = function (controllerName, testConfig, testParams, driver, callback) {
    var self = this,
        ControllerClass,
        controller;

    if (!testConfig) { testConfig = {}; }
    if (!testParams) { testParams = {}; }

    // Setting Default value of testParams.customController
    testParams.customController = false;

    if (controllerName) {
        if (controllerName.indexOf(".js") !== -1) {
            // its a user provided custom controller, marking the flag true.
            testParams.customController = true;
            controllerName = path.resolve(process.cwd(), controllerName);
        } else {
            var ctrName = controllerName;
            controllerName = path.join(this.config["arrowModuleRoot"] ,"lib/controller/" , ctrName);
            var getControllerFromShareLib=function(){
                var customControllerJson = path.join(self.config["arrowModuleRoot"] ,"tmp","custom_controller.json");
                try{
                    if (fs.statSync(customControllerJson).isFile()) {
                        var controllerJson = require(customControllerJson);
                        if (controllerJson && controllerJson[ctrName] && controllerJson[ctrName].path) {
                            return controllerJson[ctrName].path;
                        }
                    }
                }catch(e){}
                return ctrName;  //can't find in share lib
            }
            try{
                if(!fs.statSync(path.normalize(controllerName+".js")).isFile()){ // cant find in arrow/lib
                    controllerName=getControllerFromShareLib();                 // find it in share lib
                }
            }catch(e){
                controllerName=getControllerFromShareLib();
            }
        }
    } else {
        controllerName = this.config["arrowModuleRoot"] + "lib/controller/default"; // default controller
    }

    this.logger.info("Loading controller: " + controllerName);
    ControllerClass = require(controllerName);
    controller = new ControllerClass(testConfig, testParams, driver);

    this.logger.info("Executing controller: " + controllerName);


    if (testParams.scenario) {
        driver.reports.startScenarioReport();
    } else {
        driver.reports.startReport();
    }

    controller.execute(function (error, data) {
        var errorMsg;
        if (error) {
            if (testParams.testName) {
                errorMsg = "Test failed: " + testParams.testName +
                    ", Detailed error: " + error +
                    ", Controller: " + controllerName;
            } else {
                errorMsg = error + ", Controller: " + controllerName;
            }
            self.logger.error(errorMsg);
            if (!testParams.test && !testParams.scenario) {
                driver.reports.addReport({"error" : errorMsg, "controller" : controllerName, "params" : testParams});
            } else if (testParams.test && !testParams.scenario) {
                driver.reports.addReport({"error" : errorMsg, "controller" : controllerName, "params" : testParams});
            }
        } else {

            if (!testParams.test && !testParams.scenario) {
                driver.reports.addReport({"controller" : controllerName, "params" : testParams});
            }
            driver.reports.popReportAtom();
        }

        // error, data from previous controller, controller instance
        callback(error, data, controller);
    });
};

module.exports = Arrow;

