==========================
Arrow Usage
==========================

.. _Usage:

**Usage**

--help			display this help page
--version		display installed arrow version
--lib			comma separated list of js files needed by the test
--shareLibPath		comma separated list of directories to be scan for share libraries
--page			(optional) path to the mock or production html page, for example: http://www.yahoo.com or mock.html
--driver		(optional) selenium|phantomjs|browser, default: phantomjs
--browser		(optional) firefox|chrome|opera|reuse, default: firefox
--controller	(optional) a custom controller javascript file
--engine :      (optional) engine is kind of which test runner you want to use according to your test case,default yui testrunner,Arrow also integrate with other test runner ,now yui,mocha,jasmine,qunit is supported
--engineConfig :(optional) the file path to config file or a config string
--reuseSession	(optional) true, Used to run tests in existing sessions managed by selenium. Visit http://selenuim_host/wd/hub to setup sessions.
--report		(optional) true, creates report files in junit and json format, and also prints a consolidated test report summary on console.
--testName		(optional) comma separated list of test name(s) defined in test descriptor, all other tests would be ignored.
--group			(optional) comma separated list of group(s) defined in test descriptor, all other groups would be ignored.
--logLevel		(optional) DEBUG|INFO|WARN|ERROR|FATAL, default: INFO
--dimension		(optional) a custom dimension file for defining ycb contexts
--context		(optional) name of ycb context


.. _Examples:

**Examples**

  Unit test: 
    arrow test-unit.js   --lib=../src/greeter.js
    
  Unit test that load the share library automatically:
    arrow test-unit.js --shareLibPath=../src/

  Unit test with a mock page: 
    arrow test-unit.js   --page=testMock.html   --lib=./test-lib.js

  Unit test with selenium: 
    arrow test-unit.js   --page=testMock.html   --lib=./test-lib.js   --driver=selenium

  Integration test: 
    arrow test-int.js   --page=http://www.hostname.com/testpage   --lib=./test-lib.js

  Integration test: 
    arrow test-int.js   --page=http://www.hostname.com/testpage   --lib=./test-lib.js   --driver=selenium

  Custom controller: 
    arrow   --controller=custom-controller.js   --driver=selenium
