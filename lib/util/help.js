
/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

function Help() {}

Help.showHelp = function() {

    console.info("\nOPTIONS :" + "\n" +
        "        --lib : a comma separated list of js files needed by the test" + "\n\n" +
        "        --shareLibPath: a comma separated list of directory to be scanned and loaded modules by arrow automatically" + "\n\n" +
        "        --page : (optional) path to the mock or production html page" + "\n" +
        "                   example: http://www.yahoo.com or mock.html" + "\n\n" +
        "        --driver : (optional) one of selenium|nodejs. (default: selenium)" + "\n\n" +
        "        --browser : (optional) a comma separated list of browser names, optionally with a hyphenated version number.\n" +
        "                      Example : 'firefox-12.0,chrome-10.0' or 'firefox,chrome' or 'firefox'. (default: firefox)" + "\n\n" +
        "        --engine : (optional) specify the test runner to run test case. Arrow supports test runner of yui, mocha, jasmine, qunit (default: yui)" + "\n" +
        "                      Example : --engine=mocha " + "\n\n" +
        "        --engineConfig : (optional) the file path to config file or a config string  " + "\n" +
        "                      Example : --engineConfig=./mocha-config.json or --engineConfig={\'ui\':\'tdd\'} " + "\n\n" +
        "        --keepTestReport : (optional) When set to true, the report for each descriptor from previous run will be preserved (If same descriptor is run again though, it will overwrite the previous report). (default: false) " + "\n" +
        "                      Example : --keepTestReport=true" + "\n\n" +
        "        --parallel : (optional) test thread count. Determines how many tests to run in parallel for current session. (default: 1)\n" +
        "                          Example : --parallel=3 , will run three tests in parallel" + "\n\n" +
        "        --controller :(optional)  a custom controller javascript file" + "\n\n" +
        "        --reuseSession: (optional) true/false. Specifies whether to run tests in existing sessions managed by selenium. Visit http://selenuim_host/wd/hub to setup sessions (default: false)" +
        "        --report : (optional) true/false.  creates report files in junit and json format. (default: true)" + "\n" +
        "                     also prints a consolidated test report summary on console. " + "\n\n" +
        "        --reportFolder : (optional) folderPath.  creates report files under {folderPath}/arrow-report. (default: arrow-target/arrow-report under current directory)" + "\n\n" +
        "        --testName : (optional) comma separated list of test name(s) defined in test descriptor" + "\n" +
        "                       all other tests will be ignored." + "\n\n" +
        "        --group : (optional) comma separated list of group(s) defined in test descriptor." + "\n" +
        "                    all other groups will be ignored." + "\n\n" +
        "        --logLevel : (optional) one of DEBUG|INFO|WARN|ERROR|FATAL. (default: INFO)" + "\n\n" +
        "        --dimensions : (optional) a custom dimension file for defining ycb contexts" + "\n\n" +
        "        --context : (optional) name of ycb context" + "\n\n" +
        "        --seleniumHost : (optional) override selenium host url (example: --seleniumHost=http://host.com:port/wd/hub)" + "\n\n" +
        "        --capabilities : (optional) the name of a json file containing webdriver capabilities required by your project" + "\n\n" +
        "        --startProxyServer : (optional) true/false. Starts a proxy server for all intercepting all selenium browser calls" + "\n\n" +
        "        --routerProxyConfig : (optional) filePath. Expects a Json file, in \"router\" object allows users to modify host and headers for all calls being made by browser. Also supports recording of select url calls." + "\n" +
        "                         in \"coverage\" object allow users to set \"clientSideCoverage\" to true to collect client side code coverage\n"+
        "                       Example Json :" + "\n" +
        "                       {" + "\n" +
        "                           \"router\": {" + "\n" +
        "                               \"yahoo.com\": {" + "\n" +
        "                                   \"newHost\": \"x.x.x.x (your new host ip/name)\"," + "\n" +
        "                                   \"headers\": [" + "\n" +
        "                                       {" + "\n" +
        "                                           \"param\": \"<param>\"," + "\n" +
        "                                           \"value\": \"<val>\"" + "\n" +
        "                                       }" + "\n" +
        "                                   ]," + "\n" +
        "                                   \"record\": true" + "\n" +
        "                                }," + "\n" +
        "                             }," + "\n" +
        "                           \"coverage\": {" + "\n" +
        "                               \"clientSideCoverage\": true," + "\n" +
        "                               \"coverageExclude\": [\"^http://yui.yahooapis.com.*\\\\.js$\"]" + "\n" +
        "                           }" + "\n" +
        "                      }" + "\n" +
        "        --exitCode : (optional) true/false. Causes the exit code to be non-zero if any tests fail (default: false)" + "\n" +
        "        --color : (optional) true/false. if set to false, it makes console log colorless ( hudson friendly).(default: true)" + "\n" +
        "        --coverage : (optional) true/false. creates code-coverage report for all js files included/loaded by arrow (default: false)" + "\n" +
        "        --coverageExclude : (optional) string. comma-separated list of files to exclude from coverage reports" + "\n" +
        "        --keepIstanbulCoverageJson : (optional) true/false. if set to true, it does not delete Istanbul coverage json files. (default: false)" + "\n" +
        "        --retryCount : (optional) retry count for failed tests. Determines how many times a test should be retried, if it fails. (default: 0)\n" +
        "                       Example : --retryCount=2 , will retry all failed tests 2 times." + "\n" +
        "        --useYUISandbox : (optional) true/false. Enables YUI sandboxing for your tests. (default: false)" + "\n" +
        "        --replaceParamJSON : (optional) Either .json file or json object to be replaced with its value in descriptor file" + "\n" +
        "                       Example: --replaceParamJSON=./replaceJson.json OR --replaceParamJSON={\"property\":\"finance\"} will replace value of \"property\"" + "\n" +
        "                            inside the descriptor.json with \"finance\"" +"\n" +
        "                       descriptor.json" + "\n" +
        "                       [" + "\n" +
        "                            {" +  "\n" +
        "                                \"settings\":[ \"master\" ]," + "\n" +
        "                                \"name\":\"descriptor\"," + "\n" +
        "                                \"config\":{" + "\n" +
        "                                \"baseUrl\": \"http://${property}$.yahoo.com\" " + "\n" +
        "                            }," + "\n" +
        "                                \"dataprovider\":{ " + "\n" +
        "                                \"Test sample\":{ " + "\n" +
        "                                   \"params\": {" + "\n" +
        "                                        \"test\": \"test.js\" " + "\n" +
        "                                        \"page\":\"$$config.baseUrl$$\"" + "\n" +
        "                                    }" + "\n" +
        "                                }" + "\n" +
        "                               }" + "\n" +
        "                            }" + "\n" +
        "                        ]" + "\n",

        "     --defaultParamJSON : (optional) Accepts .json file or json object as its value. If the parameters to be replaced are not found via replaceParamJSON parameter," +
            " it falls back to the parameters specified in defaultParamJSON." + "\n" +
            "                       Example: --defaultParamJSON=./defaultParams.json OR --defaultParamJSON={\"property\":\"finance\"} will replace value of \"property\"" + "\n" +
            "                            inside the descriptor.json with \"finance\"" +"\n" +
            "                       descriptor.json" + "\n" +
            "                       [" + "\n" +
            "                            {" +  "\n" +
            "                                \"settings\":[ \"master\" ]," + "\n" +
            "                                \"name\":\"descriptor\"," + "\n" +
            "                                \"config\":{" + "\n" +
            "                                \"baseUrl\": \"http://${property}$.yahoo.com\" " + "\n" +
            "                            }," + "\n" +
            "                                \"dataprovider\":{ " + "\n" +
            "                                \"Test sample\":{ " + "\n" +
            "                                   \"params\": {" + "\n" +
            "                                        \"test\": \"test.js\" " + "\n" +
            "                                        \"page\":\"$$config.baseUrl$$\"" + "\n" +
            "                                    }" + "\n" +
            "                                }" + "\n" +
            "                               }" + "\n" +
            "                            }" + "\n" +
            "                        ]" + "\n" +
            "--startArrowServer : (optional) true/false. Starts Arrow Server" + "\n\n" +
            "--startPhantomJs : (optional) true/false. Starts PhantomJs" + "\n\n"
        );

    console.log("\nEXAMPLES :" + "\n" +
        "        Unit test: " + "\n" +
        "          arrow test-unit.js --lib=../src/greeter.js" + "\n\n" +
        "        Unit test that load the share library automatically " + "\n" +
        "          arrow test-unit.js --shareLibPath=../" + "\n\n" +
        "        Unit test with a mock page: " + "\n" +
        "          arrow test-unit.js --page=testMock.html --lib=./test-lib.js" + "\n\n" +
        "        Unit test with selenium: \n" +
        "          arrow test-unit.js --page=testMock.html --lib=./test-lib.js --driver=selenium" + "\n\n" +
        "        Integration test: " + "\n" +
        "          arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js" + "\n\n" +
        "        Integration test: " + "\n" +
        "          arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js --driver=selenium" + "\n\n" +
        "        Custom controller: " + "\n" +
        "          arrow --controller=custom-controller.js --driver=selenium");
};

module.exports = Help;