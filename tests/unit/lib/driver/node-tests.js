/*
* Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

YUI.add('node-tests', function (Y, NAME) {

    var path = require('path'),
        mockery = require('mockery'),
        arrowRoot =  path.join(__dirname, '../../../../'),
        stubProcess = require(arrowRoot + '/tests/unit/stub/process.js'),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert;

    mockery.warnOnUnregistered(false);
    mockery.registerMock('child_process', stubProcess);


    function testDriver(sendReport) {
        var driver,
            DriverClass = require("../../../../lib/driver/node.js"),
            config,
            testParams,
            nodeProcess,
            pNodeArgs,
            pTestParams,
            reports,
            report,
            executed = false;

        config = {testSeed: 'seed', testRunner: 'runner',arrowModuleRoot:"root",engineConfig:"config"};
        testParams = {test: 'test.js', param: 'value',arrowModuleRoot:"root",engineConfig:"config"};
        if(!global.workingDirectory)global.workingDirectory = "root";
        driver = new DriverClass(config, {});
        driver.executeTest({}, testParams, function (errMsg) {
            executed = true;
            if (sendReport) {
                A.isTrue(!errMsg, 'Should have executed driver');
            } else {
                A.isString(errMsg, 'Should have failed to execute driver');
            }
        });

        nodeProcess = stubProcess.curProcess;
        if (sendReport) {
            nodeProcess.send({
                results: '{"name": "unittest", "failed": 0, "passed": 0}'
            });
        }
        nodeProcess.notify('exit');

        reports = driver.getReports();


        if (sendReport) {
            report = reports.results[0];
            A.areEqual(report.name, 'unittest', 'Report should be added');
        } else {

            A.areEqual(reports.results, null, 'No report should be added');
        }

        pNodeArgs = JSON.parse(decodeURI(nodeProcess.args[0]));
        A.areEqual(pNodeArgs.seed, 'root/lib/engine/yuitest/yuitest-seed.js', 'Seed should be passed');
        A.areEqual(pNodeArgs.runner, 'root/lib/engine/yuitest/yuitest-runner.js', 'Runner should be passed');
        A.isTrue(pNodeArgs.test.indexOf('test.js')!=-1, 'Test should be passed');
        pTestParams = JSON.parse(decodeURI(nodeProcess.args[1]));
        A.areEqual(pTestParams.param, 'value', 'Params should have been passed');

        A.isTrue(executed, 'Should have executed driver');
    }

    suite.add(new Y.Test.Case({
        'setUp': function() {
            mockery.enable();
        },
        'tearDown': function() {
            mockery.disable();
        },

        'test driver': function () {
            testDriver(true);
        },

        'test driver no report': function () {
            testDriver(false);
        },

        'test driver error': function () {
            var driver,
                DriverClass = require(arrowRoot + '/lib/driver/node.js'),
                executed = false;

            driver = new DriverClass({}, {});
            driver.executeTest({}, {}, function (errMsg) {
                executed = true;
                A.isString(errMsg, 'Should have failed for no test file');
            });

            A.isTrue(executed, 'Should have executed driver');
        }
    }));

    Y.Test.Runner.add(suite);
}, '0.0.1' ,{requires:['test']});

