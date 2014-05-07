/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");

function SessionUtil() {
    this.logger = log4js.getLogger("SessionUtil");
}

/**
 * Iterates over the report and checks if there's any failed test case
 * @param reports
 * @returns {boolean}
 */
SessionUtil.prototype.isFail = function(reports) {

    var arrReport,
        isFail = false,
        j,
        k,
        results,
        testJson;

    if (reports.scenario) {
        arrReport = reports.scenario;
    } else {
        arrReport = reports.results;
    }

    if (arrReport) {
        if (arrReport.length === 0) {
            isFail = true;
        } else {
            for (j = 0; j < arrReport.length; j = j + 1) {
                if (reports.scenario) {
                    results = arrReport[j].results;
                    for (k = 0; k < results.length; k = k + 1) {
                        testJson =  results[k];
                        if (testJson.type === "report" && testJson.failed > 0) {
                            isFail = true;
                        }
                    }
                } else {
                    testJson = arrReport[j];
                    if (testJson.type === "report" && testJson.failed > 0) {
                        isFail = true;
                    }
                }
            }
        }
    }
    return isFail;

};

module.exports = SessionUtil;