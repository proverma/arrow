
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
* **--controller** a custom controller javascript file
* **--reuseSession** true/false. Specifies whether to run tests in existing sessions managed by selenium. Visit http://selenuim_host/wd/hub to setup sessions (default: false)
* **--report** true/false. Creates report files in junit and json format, and also prints a consolidated test report summary on console
* **--testName** comma separated list of test names defined in test descriptor. all other tests will be ignored
* **--group** comma separated list of groups defined in test descriptor, all other groups will be ignored
* **--logLevel** DEBUG|INFO|WARN|ERROR|FATAL (default: INFO)
* **--dimension** a custom dimension file for defining ycb contexts
* **--context** name of ycb context



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

* **glob** https://github.com/isaacs/node-glob
* **mockery** https://github.com/nathanmacinnes/Mockery
* **nopt** https://github.com/isaacs/nopt
* **colors** https://github.com/Marak/colors.js
* **express** https://github.com/visionmedia/express
* **yui** http://github.com/yui/yui3
* **JSV** http://github.com/garycourt/JSV
* **log4js** https://github.com/nomiddlename/log4js-node
* **clone** https://github.com/pvorb/node-clone
* **useragent** https://github.com/3rd-Eden/useragent
* **ytestrunner** https://github.com/gotwarlost/ytestrunner

Apart from above mentioned npm modules, Arrow also relies on these two projects

* **selenium** https://code.google.com/p/selenium/
* **ghostdriver** https://github.com/detro/ghostdriver
