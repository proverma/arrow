
#Arrow

[![Build Status](https://secure.travis-ci.org/yahoo/arrow.png?branch=master)](http://travis-ci.org/yahoo/arrow)

##Overview

Arrow is a test framework designed to promote test-driven JavaScript development. Arrow provides a consistent test creation and execution environment for both Developers and Quality Engineers.

Arrow aims to completely remove the line between development’s Unit tests, and Functional and Integration tests by providing a uniform way to create and execute both.

Arrow itself is a thin, extensible layer that marries JavaScript, NodeJS and Selenium. Arrow allows you to write tests using YUI-Test and execute those tests using NodeJS or Selenium. Additionally, Arrow provides a rich mechanism for building, organizing and executing test and test scenarios.


##Install

```
npm install -g yahoo-arrow
```


##Options


* **--help** display this help page
* **--version** display installed arrow version
* **--lib** comma separated list of js files needed by the test
* **--page** path to the mock or production html page, for example: http://www.yahoo.com or mock.html
* **--driver** one of selenium|nodejs. (default: selenium)
* **--shareLibPath** comma separated list of directories to be scaned to load module automatically
* **--browser** firefox|chrome|opera|reuse.  Specify browser version with a hypen, ex.: firefox-4.0 or opera-11.0 (default: firefox)
* **--report** true/false. Creates report files in junit and json format, and also prints a consolidated test report summary on console
* **--reportFolder** : (optional) folderPath.  creates report files in that folder. (default: descriptor folder path)
* **--testName** comma separated list of test names defined in test descriptor. all other tests will be ignored
* **--group** comma separated list of groups defined in test descriptor, all other groups will be ignored
* **--logLevel** TRACE|DEBUG|INFO|WARN|ERROR|FATAL (default: INFO)
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
        
##About Arrow share library/module loader (--shareLibPath)
When we write test cases (YUI.test) to run test by Arrow, the test cases might need load modules from YUI CDN (YUI official modules), or from user developed module for test in local, or from Arrow internal core modules (like Martini modules).

--lib <js file list> can be used to load those modules, but, the list would be very long and hard to maintain for complex test case which need load a lot of dependent modules.

--shareLibPath is to easy share module loading, it would scan the specified directories, find and regester the modules that can be loaded to server side or client side, then we can still use common methods, like YUI.use('module') or YUI.add(xxx ... require('module')), arrow would find and load the required modules.

It is recommended to organize your yui modules structure like below:
```
         Arrow
           |
         martini_lib1
              |-----lib/
              |      |-----server/
              |      |       |-----module1
              |      |       |      |-----xxx.js
              |      |       |
              |      |       |-----module2
              |      |       |      |-----xxx.js
              |      |
              |      |-----client/
              |      |       |-----xxx.js
              |      |
              |      |-----common/
              |              |-----xxx.js
              |
              |-----controller/
              |      |-----my-sample-controller.js
              |
              |-----node_modules
              |-----package.json
```

 
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

###Unit test with --shareLibPath to replace --lib:

```
arrow --page=testMock.html --shareLibPath=../ test-unit.js
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
* **xml-writer** https://github.com/lindory-project/node-xml-writer
* **ycb** https://github.com/yahoo/ycb
* **async** https://github.com/caolan/async

NPM Dev Dependencies
* **mockery** https://github.com/mfncooper/mockery
* **ytestrunner** https://github.com/gotwarlost/ytestrunner

Apart from above mentioned npm modules, Arrow also relies on these two projects

* **selenium** https://code.google.com/p/selenium/
* **ghostdriver** https://github.com/detro/ghostdriver
