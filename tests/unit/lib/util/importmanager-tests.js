/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI.add('importmanager-tests', function (Y) {

    var fs = require("fs");
    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        importManager = require(arrowRoot + '/lib/util/importmanager.js');
        suite = new Y.Test.Suite("Data Provider test suite");

    suite.add(new Y.Test.Case({

        "Import descriptor - with base tests": function(){

            var impMgr = new importManager();
            var baseDescriptorPath = '/tests/unit/lib/util/importDescriptor/baseDescriptor.json';
            var descriptorJson = fs.readFileSync(path.join(arrowRoot,baseDescriptorPath),'utf-8');
            descriptorJson = JSON.parse(descriptorJson);
            var cwd = process.cwd();
            var group = '';

            var processedDescJson = impMgr.processImportDescriptor(baseDescriptorPath, cwd, group, descriptorJson);
            processedDescJson = JSON.stringify(processedDescJson);

            var expectedDescJson =
            "[{\"settings\":[\"master\"]," +
                "\"name\":\"tabview\",\"commonlib\":\".\/test-lib.js\"," +
                "\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"}," +
                "\"dataprovider\":{\"base test 1\":{\"params\":{\"test\":\"test-func.js\",\"page\":\"testMock.html\"},\"group\":\"unit\"}," +
                "\"base test 2\":{\"params\":{\"test\":\"$$config.testsValue$$\",\"page\":\"$$config.baseUrl$$\/testMock.html\"},\"group\":\"func\"}," +
                "\"imported test 1\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}," +
                "\"imported test 2\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}}}," +
                "{\"settings\":[\"environment:development\"]," +
                "\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";

            Y.Assert.areEqual(expectedDescJson,processedDescJson, "Imported descriptor with base tests - JSON doesn't match");

        }

    }));

    suite.add(new Y.Test.Case({

        "Import tests - with base tests": function(){

            var impMgr = new importManager();
            var baseDescriptorPath = '/tests/unit/lib/util/importDescriptor/baseDescriptorTest.json';
            var descriptorJson = fs.readFileSync(path.join(arrowRoot,baseDescriptorPath),'utf-8');
            descriptorJson = JSON.parse(descriptorJson);
            var cwd = process.cwd();
            var group = '';

            var processedDescJson = impMgr.processImportDescriptor(baseDescriptorPath, cwd, group, descriptorJson);
            processedDescJson = JSON.stringify(processedDescJson);

            var expectedDescJson = "[{\"settings\":[\"master\"]," +
                "\"name\":\"tabview\"," +
                "\"commonlib\":\".\/test-lib.js\",\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"}," +
                "\"dataprovider\":" +
                "{\"base test 1\":{\"params\":{\"test\":\"test-func.js\",\"page\":\"testMock.html\"},\"group\":\"unit\"}," +
                "\"base test 2\":{\"params\":{\"test\":\"$$config.testsValue$$\",\"page\":\"$$config.baseUrl$$\/testMock.html\"},\"group\":\"func\"}," +
                "\"imported test 1\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}}},{\"settings\":[\"environment:development\"],\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";
            console.log(expectedDescJson);
            console.log('\n\n');
            console.log(processedDescJson);
            Y.Assert.areEqual(expectedDescJson,processedDescJson, "Import tests with base tests - JSON doesn't match");

        }

    }));

    suite.add(new Y.Test.Case({

        "Import Group - with base tests": function(){

            var impMgr = new importManager();
            var baseDescriptorPath = '/tests/unit/lib/util/importDescriptor/baseDescriptorGroup.json';
            var descriptorJson = fs.readFileSync(path.join(arrowRoot,baseDescriptorPath),'utf-8');
            descriptorJson = JSON.parse(descriptorJson);
            var cwd = process.cwd();
            var group = 'func';

            var processedDescJson = impMgr.processImportDescriptor(baseDescriptorPath, cwd, group, descriptorJson);
            processedDescJson = JSON.stringify(processedDescJson);

            var expectedDescJson = "[{\"settings\":[\"master\"]," +
                "\"name\":\"tabview\"," +
                "\"commonlib\":\".\/test-lib.js\",\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"}," +
                "\"dataprovider\":" +
                "{\"base test 1\":{\"params\":{\"test\":\"test-func.js\",\"page\":\"testMock.html\"},\"group\":\"unit\"}," +
                "\"base test 2\":{\"params\":{\"test\":\"$$config.testsValue$$\",\"page\":\"$$config.baseUrl$$\/testMock.html\"},\"group\":\"func\"}," +
                "\"imported test 2\":{\"group\":\"func\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"}," +
                "\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}}},{\"settings\":[\"environment:development\"]," +
                "\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";
            console.log(expectedDescJson);
            console.log('\n\n');
            console.log(processedDescJson);
            Y.Assert.areEqual(expectedDescJson,processedDescJson, "Import tests with base tests - JSON doesn't match");

        }

    }));

    suite.add(new Y.Test.Case({

        "Import descriptor - without base tests": function(){

            var impMgr = new importManager();
            var baseDescriptorPath = '/tests/unit/lib/util/importDescriptor/baseDescriptorNoBaseTests.json';
            var descriptorJson = fs.readFileSync(path.join(arrowRoot,baseDescriptorPath),'utf-8');
            descriptorJson = JSON.parse(descriptorJson);
            var cwd = process.cwd();
            var group = '';

            var processedDescJson = impMgr.processImportDescriptor(baseDescriptorPath, cwd, group, descriptorJson);
            processedDescJson = JSON.stringify(processedDescJson);

            var expectedDescJson =
                "[{\"settings\":[\"master\"],\"name\":\"tabview\",\"commonlib\":\".\/test-lib.js\"," +
                    "\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"}," +
                    "\"dataprovider\":{" +
                    "\"imported test 1\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}," +
                    "\"imported test 2\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}}}," +
                    "{\"settings\":[\"environment:development\"]," +
                    "\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";

            Y.Assert.areEqual(expectedDescJson,processedDescJson, "Import descriptor without base tests - JSON doesn't match");

        }

    }));

    suite.add(new Y.Test.Case({

        "No import": function(){

            var impMgr = new importManager();
            var baseDescriptorPath = '/tests/unit/lib/util/importDescriptor/baseDescriptorNoImport.json';
            var descriptorJson = fs.readFileSync(path.join(arrowRoot,baseDescriptorPath),'utf-8');
            descriptorJson = JSON.parse(descriptorJson);
            var cwd = process.cwd();
            var group = '';

            var processedDescJson = impMgr.processImportDescriptor(baseDescriptorPath, cwd, group, descriptorJson);
            processedDescJson = JSON.stringify(processedDescJson);

            var expectedDescJson =

                "[{\"settings\":[\"master\"]," +
                    "\"name\":\"tabview\"," +
                    "\"commonlib\":\".\/test-lib.js\"," +
                    "\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"}," +
                    "\"dataprovider\":{\"base test 1\":{\"params\":{\"test\":\"test-func.js\",\"page\":\"testMock.html\"},\"group\":\"unit\"},\"base test 2\":{\"params\":{\"test\":\"$$config.testsValue$$\",\"page\":\"$$config.baseUrl$$\/testMock.html\"},\"group\":\"func\"}}},{\"settings\":[\"environment:development\"],\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";

            Y.Assert.areEqual(expectedDescJson,processedDescJson, "Imported descriptor - JSON doesn't match");

        }

    }));

    suite.add(new Y.Test.Case({

        "Import descriptor with common libs - with base tests": function(){

            var impMgr = new importManager();
            var baseDescriptorPath = '/tests/unit/lib/util/importDescriptor/baseDescriptorWithLib.json';
            var descriptorJson = fs.readFileSync(path.join(arrowRoot,baseDescriptorPath),'utf-8');
            descriptorJson = JSON.parse(descriptorJson);
            var cwd = process.cwd();
            var group = '';

            var processedDescJson = impMgr.processImportDescriptor(baseDescriptorPath, cwd, group, descriptorJson);
            processedDescJson = JSON.stringify(processedDescJson);

            var expectedDescJson =
                "[{\"settings\":[\"master\"]," +
                    "\"name\":\"tabview\",\"commonlib\":\".\/test-lib.js,/tests/unit/lib/util/importDescriptor/imported-test-lib.js,/tests/unit/lib/util/importDescriptor/imported-test-lib-2.js\"," +
                    "\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"}," +
                    "\"dataprovider\":{\"base test 1\":{\"params\":{\"test\":\"test-func.js\",\"page\":\"testMock.html\"},\"group\":\"unit\"}," +
                    "\"base test 2\":{\"params\":{\"test\":\"$$config.testsValue$$\",\"page\":\"$$config.baseUrl$$\/testMock.html\"},\"group\":\"func\"}," +
                    "\"imported test 1\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}," +
                    "\"imported test 2\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}}}," +
                    "{\"settings\":[\"environment:development\"]," +
                    "\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";

            Y.Assert.areEqual(expectedDescJson,processedDescJson, "Imported descriptor with base tests - JSON doesn't match");

        }

    }));


    suite.add(new Y.Test.Case({

        "Import descriptor - No data provider": function(){

            var impMgr = new importManager();
            var baseDescriptorPath = '/tests/unit/lib/util/importDescriptor/baseDescriptorNoDataProvider.json';
            var descriptorJson = fs.readFileSync(path.join(arrowRoot,baseDescriptorPath),'utf-8');
            descriptorJson = JSON.parse(descriptorJson);
            var cwd = process.cwd();
            var group = '';

            var processedDescJson = impMgr.processImportDescriptor(baseDescriptorPath, cwd, group, descriptorJson);
            processedDescJson = JSON.stringify(processedDescJson);

            var expectedDescJson =
                "[{\"settings\":[\"master\"]," +
                    "\"name\":\"tabview\",\"commonlib\":\".\/test-lib.js\"," +
                    "\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"}," +
                    "\"dataprovider\":{" +
                    "\"imported test 1\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}," +
                    "\"imported test 2\":{\"group\":\"\",\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"},\"relativePath\":\"\/tests\/unit\/lib\/util\/importDescriptor\"}}}," +
                    "{\"settings\":[\"environment:development\"]," +
                    "\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";

            Y.Assert.areEqual(expectedDescJson,processedDescJson, "Imported descriptor with base tests - JSON doesn't match");

        }

    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

 
 
 
 
 
 