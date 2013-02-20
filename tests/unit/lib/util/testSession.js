var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    reportObj,
    sessions,
    report,
    arrowRoot = path.join(__dirname, '../../../..'),
    StubDriver = require(arrowRoot + '/tests/unit/stub/driver.js'),
    i;

function TestSession(report, scenario) {

    this.driver = new StubDriver();

    if (scenario) {
        this.driver.reports.startScenarioReport();
    } else {
        this.driver.reports.startReport();
    }

    this.driver.addReport(report);

}

module.exports = TestSession;