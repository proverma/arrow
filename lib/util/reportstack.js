/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

var log4js = require("log4js");

function ReportStack() {
    this.logger = log4js.getLogger("ReportStack");
    this.report = {};
    this.stkReportAtom = [this.report];
}

/**
 * Whenever a scenario test starts, this function is called,
 */
ReportStack.prototype.startScenarioReport = function () {
    var obj = this.stkReportAtom[this.stkReportAtom.length - 1];
    obj.scenario = [];
    this.stkReportAtom.push(obj.scenario);
};

/*
 * Whenever a non-scenario test starts, this function is called,
 */
ReportStack.prototype.startReport = function () {

    var obj = this.stkReportAtom[this.stkReportAtom.length - 1];

    if (obj.push) {
        obj.push({results : []});
        this.stkReportAtom.push(obj[obj.length - 1].results);
    } else {
        obj.results = [];
        this.stkReportAtom.push(obj.results);
    }
};

/**
 * This gets called from the driver class for every YUI test suite, which returns a report
 * @param reportJson
 */
ReportStack.prototype.addReport = function (reportJson) {
    var obj = this.stkReportAtom[this.stkReportAtom.length - 1];
    if (obj.push) {
        obj.push(reportJson);
    } else {
        this.startReport();
        this.stkReportAtom[this.stkReportAtom.length - 1].push(reportJson);
    }
};

/**
 * Almost like a teardown , gets called after a test/atom is completed. It removes the current object from the stack.
 */
ReportStack.prototype.popReportAtom = function () {

    this.stkReportAtom.pop();
};


ReportStack.prototype.getReport = function () {

    return this.report;
};

module.exports = ReportStack;