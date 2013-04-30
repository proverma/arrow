/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('coverage-tests', function (Y, NAME) {

    var path = require('path'),
        http = require('http'),
        util = require('util'),
        arrowRoot =  path.join(__dirname, '../../../../'),
        coverage = require("../../../../lib/util/coverage.js"),
        path = require("path"),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        self = this;

    /**
     * test addInstrumentcandidate
     */
    function testAddInstrumentCandidate() {

        console.log('<<dirname:' + __dirname);
        var file = __dirname + "/config/dummyconfig.js";
        coverage.addInstrumentCandidate(file);

    }


    /**
     * test unhookRequire
     */
    function testUnhookRequire() {
        coverage.unhookRequire();
    }

    /**
     * test hookRequire
     */
    function testHookRequire() {
        var verbose = {'a': 'b'};
        coverage.hookRequire(verbose);
    }


    /**
     * test getFinalCoverage
     */
    function testGetFinalCoverage() {
        coverage.getFinalCoverage();
    }

    /**
     * test writeReports
     */
    function testWriteReports() {
        var dir;
        coverage.writeReports(dir);
    }

    /**
     * test writeReportsFor
     */
    function testWriteReportsFor() {
        var fileList = [],
            dir = __dirname + "/config/tmp";

        fileList[0] = "a";
        fileList[1] = "b";

        //TODO - Doesnt work
       // coverage.writeReportsFor(fileList,dir);
    }


    /**
     * test instrumentCode
     */
    function testInstrumentCode() {
        var code = ' aaa', filename = "";
        coverage.instrumentCode(code, filename);
    }


    /**
     * test instrumentFile
     */
    function testInstrumentFile() {
        var file = __dirname + "/config/configoverride.js";
        coverage.instrumentFile(file);
    }


    /**
     * test addCoverage
     */
    function testAddCoverage() {
        var coverageobject;
        //TODO - Doesnt work , intialize object properly
        //coverage.addCoverage(coverageobject);
    }

    /**
     * test collector add coverage
     */
    function testCollectorAddCoverage() {
        var collector, coverageObj; // TODO - doesnt work - method not exposed
        //coverage.collectorAddCoverage(collector,coverageObj);
    }


    suite.add(new Y.Test.Case({

        'setUp': function () {
           //console.log('>>>setup Coverage tests');
        },

        'tearDown': function () {
            //console.log('>>>teardown Coverage tests');
        },

        'test coverage Add Instrument candidate': function () {
            testAddInstrumentCandidate();
        },

        'test coverage unhook require': function () {
            testUnhookRequire();
        },

        'test coverage hook require': function () {
            testHookRequire();
        },

        'test coverage get final coverage': function () {
            testGetFinalCoverage();
        },

        'test coverage instrument code': function () {
            testInstrumentCode();
        },

        'test coverage instrument file': function () {
            testInstrumentFile();
        },

        'test coverage add coverage': function () {
            testAddCoverage();
        },

        'test coverage get write reports': function () {
            testWriteReports();
        },

        'test coverage get write reports for': function () {
            testWriteReportsFor();
        },

        'test coverage collector add coverage': function () {
            testCollectorAddCoverage();
        }


    }));

    Y.Test.Runner.add(suite);
}, '0.0.1' ,{requires:['test']});

