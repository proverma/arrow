===========
Arrow Usage
===========


Synopsis
========
| arrow [OPTION...] [TESTFILE...]


Description
===========
Arrow is a test framework designed to promote test-driven JavaScript development. Arrow provides a consistent test creation and execution environment for both Developers and Quality Engineers.

Arrow aims to completely remove the line between development’s Unit tests, and Functional and Integration tests by providing a uniform way to create and execute both.

Arrow itself is a thin, extensible layer that marries JavaScript, NodeJS, PhantomJS and Selenium. Arrow allows you to write tests using YUI-Test, Mocha, Jasmin or QUnit and execute those tests using NodeJS, PhantomJS or Selenium. Additionally, Arrow provides a rich mechanism for building, organizing and executing test and test scenarios.


Options
=======
--help
  display this help page
--version
  display installed arrow version
--lib
    comma separated list of js files needed by the test
--page
    path to the mock or production html page, for example: http://www.yahoo.com or mock.html
--driver
	selenium|phantomjs|browser. (default: phantomjs)
--browser
	firefox|chrome|opera.  Specify browser version with a hypen, ex.: firefox-4.0 or opera-11.0 (default: firefox)
--engine
    (optional) engine is kind of which test runner you want to use according to your test case,default yui testrunner,Arrow also integrate with other test runner ,now yui,mocha,jasmine,qunit is supported
--engineConfig
  (optional) the file path to config file or a config string
--keepTestReport : (optional) When set to true, the report for each descriptor from previous run will be preserved (If same descriptor is run again though, it will overwrite the previous report). (default: false)
--parallel
  (optional) test thread count. Determines how many tests to run in parallel for current session. (default: 1) Example : --parallel=3 , will run three tests in parallel
--controller
  a custom controller javascript file
--reuseSession
  true/false. Specifies whether to run tests in existing sessions managed by selenium. Visit http://selenuim_host/wd/hub to setup sessions (default: false)
--report
  true/false. Creates report files in junit and json format, and also prints a consolidated test report summary on console
--reportFolder
  (optional) folderPath.  creates report files in that folder. (default: descriptor folder path)
--testName
  comma separated list of test names defined in test descriptor. all other tests will be ignored
--group
  comma separated list of groups defined in test descriptor, all other groups will be ignored
--logLevel
  DEBUG|INFO|WARN|ERROR|FATAL (default: INFO)
--dimensions
  a custom dimension file for defining ycb contexts
--context
  name of ycb context
--seleniumHost
  (optional) override selenium host url (example: --seleniumHost=http://host.com:port/wd/hub)
--capabilities
  (optional) the name of a json file containing webdriver capabilities required by your project
--startProxyServer
  (optional) true/false. Starts a proxy server for all intercepting all selenium browser calls
--routerProxyConfig
  (optional) filePath. Expects a Json file, in router field allows users to modify host and headers for all calls being made by browser. Also supports recording of select url calls.
                           in coverage field user can config it to enable client side js files code coverage and a filter for these js.

    ::
    {
        "router": {
            "yahoo.com": {
                "newHost": "x.x.x.x (your new host ip/name)",
                "headers": [
                    {
                        "param": "<param>",
                        "value": "<val>"
                    }
                ],
                "record": true
            },
            "news.yahoo.com": {
                "newHost": "x.x.x.x (your new host ip/name)",
                "headers": [
                    {
                        "param": "<param>",
                        "value": "<val>"
                    }
                ],
                "record": true
            }
        },
        "coverage": {
            "clientSideCoverage": true,
            "coverageExclude": []
        }
    }
--exitCode
 (optional) true/false. Causes the exit code to be non-zero if any tests fail (default: false)
--color
 (optional) true/false. if set to false, it makes console log colorless ( Hudson friendly).(default: true)
--coverage
 (optional) true/false. creates code-coverage report for all js files included/loaded by arrow (default: false)
--coverageExclude
 (optional) string. comma-separated list of files to exclude from coverage reports
--keepIstanbulCoverageJson
 (optional) true/false. if set to true, it does not delete Istanbul coverage json files. (default: false)
--retryCount
 (optional) retry count for failed tests. Determines how many times a test should be retried, if it fails. (default: 0) Example : --retryCount=2 , will retry all failed tests 2 times
--useYUISandbox : (optional) true/false. Enables YUI sandboxing for your tests. (default: false)
 --replaceParamJSON : (optional) Either .json file or json object to be replaced with its value in descriptor file
                       Example: --replaceParamJSON=./replaceJson.json OR --replaceParamJSON={"property":"finance"} will replace value of "property"
                            inside the descriptor.json with "finance"
                       descriptor.json
                       [
                            {
                                "settings":[ "master" ],
                                "name":"descriptor",
                                "config":{
                                "baseUrl": "http://${property}$.yahoo.com"
                            },
                                "dataprovider":{
                                "Test sample":{
                                   "params": {
                                        "test": "test.js"
                                        "page":"$$config.baseUrl$$"
                                    }
                                }
                               }
                            }
                        ]
 --defaultParamJSON : (optional) Accepts .json file or json object as its value. If the parameters to be replaced are not found via replaceParamJSON parameter, it falls back to the parameters specified in defaultParamJSON.
                       Example: --defaultParamJSON=./defaultParams.json OR --defaultParamJSON={"property":"finance"} will replace value of "property"
                            inside the descriptor.json with "finance"
                       descriptor.json
                       [
                            {
                                "settings":[ "master" ],
                                "name":"descriptor",
                                "config":{
                                "baseUrl": "http://${property}$.yahoo.com"
                            },
                                "dataprovider":{
                                "Test sample":{
                                   "params": {
                                        "test": "test.js"
                                        "page":"$$config.baseUrl$$"
                                    }
                                }
                               }
                            }
                        ]
--startArrowServer : (optional) true/false. Starts Arrow Server
--startPhantomJs : (optional) true/false. Starts PhantomJs

Examples
========
| Below are some examples to help you get started.

| Unit test:
|    arrow --lib=../src/greeter.js test-unit.js

| Unit test with a mock page:
|    arrow --page=testMock.html --lib=./test-lib.js test-unit.js

|  Unit test with selenium:
|    arrow --page=testMock.html --lib=./test-lib.js --driver=selenium test-unit.js

|  Integration test:
|    arrow --page=http://www.hostname.com/testpage --lib=./test-lib.js test-int.js

|  Integration test:
|    arrow --page=http://www.hostname.com/testpage --lib=./test-lib.js --driver=selenium test-int.js

|  Custom controller:
|    arrow --controller=custom-controller.js --driver=selenium


See Also
========

| arrow_server(1)


Third Party Libraries
=======================

The following third-party npm modules are used by Arrow:

| glob https://github.com/isaacs/node-glob
| mockery https://github.com/nathanmacinnes/Mockery
| nopt https://github.com/isaacs/nopt
| colors https://github.com/Marak/colors.js
| express https://github.com/visionmedia/express
| yui http://github.com/yui/yui3
| JSV http://github.com/garycourt/JSV
| log4js https://github.com/nomiddlename/log4js-node
| clone https://github.com/pvorb/node-clone
| useragent https://github.com/3rd-Eden/useragent
| ytestrunner https://github.com/gotwarlost/ytestrunner

Apart from those npm modules, Arrow also uses these two tools

| selenium https://code.google.com/p/selenium/
| ghostdriver https://github.com/detro/ghostdriver
