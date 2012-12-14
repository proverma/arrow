
#Arrow

[![Build Status](https://secure.travis-ci.org/yahoo/arrow.png?branch=master)](http://travis-ci.org/yahoo/arrow)

##Overview

Arrow is a test framework designed to promote test-driven JavaScript development. Arrow provides a consistent test creation and execution environment for both Developers and Quality Engineers.

Arrow aims to completely remove the line between development’s Unit tests, and Functional and Integration tests by providing a uniform way to create and execute both.

Arrow itself is a thin, extensible layer that marries JavaScript, NodeJS, PhantomJS and Selenium. Arrow allows you to write tests using YUI-Test and execute those tests using NodeJS, PhantomJS or Selenium. Additionally, Arrow provides a rich mechanism for building, organizing and executing test and test scenarios.


##Install

```
npm install -g yahoo-arrow
```


##Options


* **--help** display this help page
* **--version** display installed arrow version
* **--lib** comma separated list of js files needed by the test
* **--page** path to the mock or production html page, for example: http://www.yahoo.com or mock.html
* **--driver** selenium|phantomjs|browser. (default: phantomjs)
* **--browser** firefox|chrome|opera|reuse.  Specify browser version with a hypen, ex.: firefox-4.0 or opera-11.0 (default: firefox)
* **--report** true/false. Creates report files in junit and json format, and also prints a consolidated test report summary on console
* **--reportFolder** : (optional) folderPath.  creates report files in that folder. (default: descriptor folder path)
* **--testName** comma separated list of test names defined in test descriptor. all other tests will be ignored
* **--group** comma separated list of groups defined in test descriptor, all other groups will be ignored
* **--logLevel** DEBUG|INFO|WARN|ERROR|FATAL (default: INFO)
* **--dimension** a custom dimension file for defining ycb contexts
* **--context** name of ycb context
* **--seleniumHost** : (optional) override selenium host url (example: --seleniumHost=http://host.com:port/wd/hub)
* **--capabilities** : (optional) the name of a json file containing webdriver capabilities required by your project
* **--startProxyServer** : (optional) true/false. Starts a proxy server, intercepting all selenium browser calls
* **--routerProxyConfig** : (optional) filePath. Expects a Json file, allows users to modify host and headers for all calls being made by browser. Also supports recording of select url calls ( if you mark "record" : true)
        
        
         Example Json :
                       {
                           "yahoo.com": {
                               "newHost": "x.x.x.x (your new host ip/name)",
                               "headers":[
                                   {
                                       "param": "<param>",
                                       "value": "<val>"
                                   }
                               ],
                               "record": true
                            },
                            "news.yahoo.com": {
                               "newHost": "x.x.x.x (your new host ip/name)",
                               "headers":[
                                   {
                                       "param": "<param>",
                                       "value": "<val>"
                                   }
                               ],
                               "record": true
                            }
                       }
        
* **--exitCode** : (optional) true/false. Causes the exit code to be non-zero if any tests fail (default: false)
* **--coverage** : (optional) true/false. creates code-coverage report for all js files included/loaded by arrow (default: false)
        
##Examples

Below are some examples to help you get started.

###Unit test:

```
arrow --lib=../src/greeter.js test-unit.js
```

###Unit test with a mock page:

```
arrow --page=testMock.html --lib=./test-lib.js test-unit.js
```

###Unit test with selenium:

```
arrow --page=testMock.html --lib=./test-lib.js --driver=selenium test-unit.js
```

###Integration test:

```
arrow --page=http://www.hostname.com/testpage --lib=./test-lib.js test-int.js
```

###Integration test:

```
arrow --page=http://www.hostname.com/testpage --lib=./test-lib.js --driver=selenium test-int.js
```

###Custom controller:

```
arrow --controller=custom-controller.js --driver=selenium
```


##Arrow Dependencies

NPM Dependencies
* **glob** https://github.com/isaacs/node-glob
* **nopt** https://github.com/isaacs/nopt
* **colors** https://github.com/Marak/colors.js
* **express** https://github.com/visionmedia/express
* **yui** http://github.com/yui/yui3
* **JSV** http://github.com/garycourt/JSV
* **log4js** https://github.com/nomiddlename/log4js-node
* **clone** https://github.com/pvorb/node-clone
* **useragent** https://github.com/3rd-Eden/useragent
* **istanbul** https://github.com/yahoo/istanbul
* **uglify-js** https://github.com/mishoo/UglifyJS

NPM Dev Dependencies
* **mockery** https://github.com/mfncooper/mockery
* **ytestrunner** https://github.com/gotwarlost/ytestrunner

Apart from above mentioned npm modules, Arrow also relies on these two projects

* **selenium** https://code.google.com/p/selenium/
* **ghostdriver** https://github.com/detro/ghostdriver
