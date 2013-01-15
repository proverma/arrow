/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/
/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var fs = require("fs");
var path = require("path");
var clone = require("clone");
var childProcess = require("child_process");
var colors = require("colors");
var log4js = require("log4js");
var coverage = require("../util/coverage");

// recursive folder search
function ArrowRecursive(config, args) {
    var k;
    this.logger = log4js.getLogger("ArrowRecursive");
    this.config = config;
    this.args = args;
    this.arrDescriptor = [];
    this.currentDir = process.cwd();
    this.recArgs = clone(this.args.argv.original);

    //checking if we need to do colorless reporting.
    if (global.color === false) {
        colors.mode = "none";
    }

    if (this.args.dimensions) {
        for (k in this.recArgs) {
            if (this.recArgs[k].indexOf("dimensions") !== -1) {
                this.recArgs[k] = "--dimensions=" + path.resolve(global.workingDirectory, this.args.dimensions);
            }
        }
    }

    if (this.args.routerProxyConfig) {
        for (k in this.recArgs) {
            if (this.recArgs[k].indexOf("routerProxyConfig") !== -1) {
                this.recArgs[k] = "--routerProxyConfig=" + path.resolve(global.workingDirectory, this.args.routerProxyConfig);
            }
        }
    }

    this.descriptorExecutionCount = 0;
    this.descriptorTotalCount = 0;
}

ArrowRecursive.prototype.runAllDescriptors = function (descriptors) {
    this.arrDescriptor = descriptors;
    this.descriptorTotalCount = this.arrDescriptor.length;

    if (this.arrDescriptor.length > 0) {
        this.runSingleDescriptor();
    } else {
        this.logger.error("No descriptors to run.");
    }
};

ArrowRecursive.prototype.runSingleDescriptor = function () {
    var self = this,
        filePath = this.arrDescriptor[this.descriptorExecutionCount],
        fileName,
        testFolder,
        testArgs,
        arrowCmd;

    self.logger.info("Running Test Descriptor Path : " + filePath);
    testFolder = path.dirname(filePath);
    fileName = path.basename(filePath);

    self.logger.info("Switching to path: " + testFolder);
    process.chdir(testFolder);

    testArgs = clone(self.recArgs);


    testArgs.unshift(fileName); // to make sure the first one is the headless param we want
    testArgs.push("--arrowChildProcess=true");

    self.logger.trace("testargs :" + testArgs);
    arrowCmd = childProcess.fork(global.appRoot + "/index.js", testArgs);
    //NOT DOING EXIT, As it does not waits for last browser to close. NEED to revisit this later, as child process's may still linger in system memory
//    arrowCmd.on('exit',function(msg){
//        self.descriptorExecutionCount++;
//        if(self.descriptorExecutionCount < self.descriptorTotalCount){
//            self.runSingleDescriptor(self.descriptorExecutionCount);
//        }else{
//             console.log("All done");
//               console.log("Report Gathering");
//        }
//    });

    arrowCmd.on('message', function (msg) {
        self.logger.trace("Message Received :" + msg);
        if (msg.SessionFactory === "Done") {
            if (msg.covReport) {
                global.coverageMap.push(msg.covReport);
            }

            if (msg.reportFile) {
                global.reportMap.push({"desc" : filePath, "report" : msg.reportFile});
            }

            self.descriptorExecutionCount += 1;
            //revert back to initial working directory
            process.chdir(global.workingDirectory);
            self.logger.trace(self.descriptorExecutionCount + "<" +  self.descriptorTotalCount);
            if (self.descriptorExecutionCount < self.descriptorTotalCount) {
                self.runSingleDescriptor(self.descriptorExecutionCount);
            } else {
                process.chdir(global.workingDirectory);
                if (self.args.report) {
                    self.showRecursiveReport();
                } else {
                    self.tearDown();
                }
            }
        }
    });
};

ArrowRecursive.prototype.showRecursiveReport = function (currentCount) {
    var totalCount = 0,
        passCount = 0,
        failCount = 0,
        skipCount = 0,
        arrFailedDescriptors = {},
        reportPath,
        data,
        desc,
        rep,
        fail,
        i,
        k,
        x,
        ts,
        tmp,
        stats,
        val,
        arrReport,
        testJson,
        results,
        blnFail = false,
        self = this;

    this.logger.trace(this.arrDescriptor);

    for (i = 0; i < global.reportMap.length; i += 1) {
        data = JSON.parse(fs.readFileSync(global.reportMap[i].report.replace("xml", "json"), 'utf-8'));
        fail = 0;
        for (x in data) {
            rep = data[x];
            if (rep.scenario) {
                arrReport = rep.scenario;
            } else {
                arrReport = rep.results;
            }
            if (arrReport) {
                for (j = 0; j < arrReport.length; j = j + 1) {
                    if (rep.scenario) {
                        results = arrReport[j].results;
                        for (k = 0; k < results.length; k = k + 1) {
                            testJson =  results[k];
                            if (testJson.type === "report") {
                                totalCount += testJson.total;
                                fail += testJson.failed;
                                skipCount += testJson.ignored;
                            }
                        }
                    } else {
                        testJson = arrReport[j];
                        if (testJson.type === "report") {
                            totalCount += testJson.total;
                            fail += testJson.failed;
                            skipCount += testJson.ignored;
                        }
                    }
                }
            }
        }

        if (fail > 0) {
            arrFailedDescriptors[global.reportMap[i].desc] = fail;
            failCount += fail;
            blnFail = true;
        }

    }

    passCount = totalCount - failCount - skipCount;
    console.log("********************************************".bold.magenta);
    console.log("Consolidated Test Report Summary".bold.magenta);
    console.log("********************************************".bold.magenta);

    console.log(("Total Number of Executed Tests  :" + totalCount).blue);
    console.log(("Total Number of Passed Tests  : " + passCount).green);
    console.log(("Total Number of Failed Tests  : " + failCount).red);
    console.log(("Total Number of Skipped Tests  : " + skipCount).grey);
    console.log("********************************************".bold.magenta);

    if (blnFail) {
        console.log("List of Failed Test Descriptors".bold.magenta);
        console.log("********************************************".bold.magenta);
        for (k in arrFailedDescriptors) {
            console.log("Failed Descriptor Path : ".grey +  k.toString().red);
            console.log("Total Number of Failed Tests : ".grey +  arrFailedDescriptors[k].toString().red);
            console.log("--------------------------------------------".bold.magenta);
        }
    }
    console.log();



    self.tearDown(failCount);
};

ArrowRecursive.prototype.tearDown = function(failCount) {
    var i;

    if (this.config.coverage) {
        //console.log(global.coverageMap);
        coverage.writeReportsFor(global.coverageMap, "coverage");

        //now deleting temp coverage files
        for (i = 0; i < global.coverageMap.length; i += 1) {
            fs.unlinkSync(global.coverageMap[i]);
        }
    }
    this.logger.trace("Final TearDown");
    process.exit((this.config.exitCode && failCount) ? 1 : 0);
};

module.exports = ArrowRecursive;

