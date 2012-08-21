
#Arrow



##Overview

Arrow is a test framework designed to promote test-driven JavaScript development. Arrow provides a consistent test creation and execution environment for both Developers and Quality Engineers.

Arrow aims to completely remove the line between development’s Unit tests, and Functional and Integration tests by providing a uniform way to create and execute both.

Arrow itself is a thin, extensible layer that marries JavaScript, NodeJS, PhantomJS and Selenium. Arrow allows you to write tests using YUI-Test and execute those tests using NodeJS, PhantomJS or Selenium. Additionally, Arrow provides a rich mechanism for building, organizing and executing test and test scenarios.


##Options


**--help** display this help page <br>
**--version** display installed arrow version<br>
**--lib**			comma separated list of js files needed by the test<br>
**--page**			path to the mock or production html page, for example: http://www.yahoo.com or mock.html<br>
**--driver**		selenium|phantomjs|browser. (default: phantomjs)<br>
**--browser**		firefox|chrome|opera|reuse.  Specify browser version with a hypen, ex.: firefox-4.0 or opera-11.0 (default: firefox)<br>
**--controller**		a custom controller javascript file<br>
**--reuseSession**		true/false. Specifies whether to run tests in existing sessions managed by selenium. Visit http://selenuim_host/wd/hub to setup sessions (default: false)<br>
**--report**		true/false. Creates report files in junit and json format, and also prints a consolidated test report summary on console<br>
**--testName**		comma separated list of test names defined in test descriptor. all other tests will be ignored<br>
**--group**			comma separated list of groups defined in test descriptor, all other groups will be ignored<br>
**--logLevel**		DEBUG|INFO|WARN|ERROR|FATAL (default: INFO)<br>
**--dimension**		a custom dimension file for defining ycb contexts<br>
**--context**		name of ycb context<br>



##Examples

Below are some examples to help you get started.

###Unit test:
arrow --lib=../src/greeter.js test-unit.js

###Unit test with a mock page:
arrow --page=testMock.html --lib=./test-lib.js test-unit.js

###Unit test with selenium:
arrow --page=testMock.html --lib=./test-lib.js --driver=selenium test-unit.js

###Integration test:
arrow --page=http://www.hostname.com/testpage --lib=./test-lib.js test-int.js

###Integration test:
arrow --page=http://www.hostname.com/testpage --lib=./test-lib.js --driver=selenium test-int.js

###Custom controller:
arrow --controller=custom-controller.js --driver=selenium


##Arrow Dependencies

**glob** https://github.com/isaacs/node-glob<br>
**mockery** https://github.com/nathanmacinnes/Mockery<br>
**nopt** https://github.com/isaacs/nopt<br>
**colors** https://github.com/Marak/colors.js<br>
**express** https://github.com/visionmedia/express<br>
**yui** http://github.com/yui/yui3<br>
**JSV** http://github.com/garycourt/JSV<br>
**log4js** https://github.com/nomiddlename/log4js-node<br>
**clone** https://github.com/pvorb/node-clone<br>
**useragent** https://github.com/3rd-Eden/useragent<br>
**ytestrunner** https://github.com/gotwarlost/ytestrunner<br>

Apart from above mentioned npm modules, Arrow also relies on these two projects

**selenium** https://code.google.com/p/selenium/<br>
**ghostdriver** https://github.com/detro/ghostdriver
