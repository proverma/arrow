==========
Arrow FAQs
==========

If you don't find an answer here, please do not hesitate to email us

How to run arrow tests from Linux box to Windows machine?
----------------------------------------------------------

Make sure you have following setup before running arrow tests

1. Linux box has arrow installed and it has all the packages listed `here <./arrow_getting_started.rst#linux>`_ (Only start arrow_server if you are running unit tests)
2. Windows machine has `selenium server <./arrow_getting_started.rst#selenium-server>`_ up and running (Check http://yourIP:4444/wd/hub is loading fine)
3. Now run the arrow test and do not forget to pass the --seleniumHost=http://yourIP:4444/wd/hub while running your tests

::

    arrow test-descriptor.json --seleniumHost=http://110.32.34.65:4444/wd/hub --browser=firefox

How to debug failures for, "arrow failed to collect report" cases?
-------------------------------------------------------------------

Usually this happens when there is some JS error inside your test script and to debug it further do following,

1. Run selenium with default profile

::

    java -Dwebdriver.firefox.profile=default -jar selenium-server-standalone-2.25.0.jar

2. Now from your firefox where you are running selenium, open http://yourIP:4444/wd/hub and create a firefox session
3. Open the firebug console for this newly created session
4. Trigger your tests, this will keep the browser window open after the tests fail and you can see JS errors on the console


Error: Cannot find module 'abbrev'
----------------------------------

::

  node.js:201
          throw e; // process.nextTick error, or 'error' event on first tick
                ^
  Error: Cannot find module 'abbrev'
      at Function._resolveFilename (module.js:334:11)
      at Function._load (module.js:279:25)
      at Module.require (module.js:357:17)
      at require (module.js:368:17)
      at Object.<anonymous> (/usr/local/lib/node_modules/arrow/lib/nopt/lib/nopt.js:10:14)
      at Module._compile (module.js:432:26)
      at Object..js (module.js:450:10)
      at Module.load (module.js:351:31)
      at Function._load (module.js:310:12)
      at Module.require (module.js:357:17)

Solution
========

Install the abbrev module

::

  sudo npm install abbrev -g

Error: SyntaxError?: Unexpected token }
---------------------------------------

::

    SyntaxError?: Unexpected token }

    node.js:201
            throw e; // process.nextTick error, or 'error' event on first tick
                  ^
    SyntaxError: Unexpected token }
        at Object.parse (native)
        at DataProvider.getTestData (/usr/local/lib/node_modules/arrow/lib/util/dataprovider.js:21:31)
        at SessionFactory.runAllTestSessions (/usr/local/lib/node_modules/arrow/lib/session/sessionfactory.js:55:12)
        at Object.<anonymous> (/usr/local/lib/node_modules/arrow/index.js:56:16)
        at Module._compile (module.js:432:26)
        at Object..js (module.js:450:10)
        at Module.load (module.js:351:31)
        at Function._load (module.js:310:12)
        at Array.0 (module.js:470:10)
        at EventEmitter._tickCallback (node.js:192:40)

Solution
========

It's likely you have an extra character in your descriptor JSON file.

Error: Arrow Server is not Running
----------------------------------

::

    node.js:137
           throw e; // process.nextTick error, or 'error' event on first tick
           ^
    arrow_server is not running

Solution
========
You need to start Arrow server like this

::

  arrow_server

Because arrow_server needs to KEEP running, start it on a different command prompt than the one you are using for testing

How do I point Arrow to a Specific Selenium Server
--------------------------------------------------

There may be situations where the Selenium Server may not be running on the localhost and/or you may be pointing to a Selenium Grid instance.

Solution
========

You can tell Arrow to point to a specific Selenium Host in two ways

1. Update the `config file's <./arrow_in-depth.rst#configuration>`_ seleniumHost value
2. Use the **--seleniumHost** parameter in your command

**Note** you need to include the **FULL** path to Selenium Server like this:

::

  seleniumHost=http://url.to.server:port/wd/hub

[ERROR] ArrowServer - <Buffer 65 78 65
--------------------------------------

When running Arrow Server, you get a buffer error like this

::

  [2012-06-07 16:52:24.745] [ERROR] ArrowServer - <Buffer 65 78 65 63 76 70 28 29 3a 20 50 65 72 6d 69 73 73 69 6f 6e 20 64 65 6e 69 65 64 0a>

Solution
========

Make sure you have `installed PhantomJS <./arrow_getting_started.rst#mac-installation>`_

How can I use the Locator Controller to Login?
----------------------------------------------

Built-in, Arrow comes with two controllers, default and `locator <./arrow_in-depth.rst#the-locator-controller>`_

Solution
========

You can use the locator controller to *log you into* Yahoo should you need it. In this example we'll do the following:

1. Open login.yahoo.com with the final URL as the *done* URL
2. Execute the test

::

  [
      {
          "settings": [ "master" ],
          "name": "YahooLogin",
          "config": {
              "baseUrl": "http://finance.yahoo.com"
          },
          "dataprovider" : {

              "Use Locator to Login" : {
                  "group" : "func",
                  "params" :{
                      "scenario": [
                          {
                              "page": "http://login.yahoo.com/config/login?login=arrowtestuser1@yahoo.com&passwd=123456&.done=$$config.baseUrl$$"
                          },
                          {
                              "page": "$$config.baseUrl$$"
                          },
                          {
                              "test": "test-title.js",
                              "title": "Yahoo! Finance - Business Finance, Stock Market, Quotes, News"
                          }
                      ]
                  }
              }
          }
      },
      {
          "settings": [ "environment:development" ]
      }
  ]


How can I install a specific Arrow version?
-------------------------------------------

Though we don't encourage this, there may be times when you may need to use a specific version of Arrow.

Solution
========

You can install a specific version like this:

::

.. TODO... needs to be updated

   sudo npm install --registry=http:// arrow@<version> -g

To install version 0.0.43

::

.. TODO... needs to be updated

  sudo npm install --registry=http:// arrow@0.0.43 -g


My Project/Tests are using NodeJS 4.x, the new versions of Arrow expect NodeJS 6+. Will I have problems?
--------------------------------------------------------------------------------------------------------

After version XXX of Arrow, Arrow will no longer support NodeJS 4.x. How will this affect my tests, and what impact will this have to me?

Solution
========

Because our dependencies are part of the NPM package, provided you do not upgrade, this should not cause you any problems. In other words, the dependencies for a given version of Arrow are tied to that version. Therefore, you should be able to continue using a previous version of Arrow without any issues.


How do I ensure custom controllers with multiple descriptors run successfully?
------------------------------------------------------------------------------

On hudson using package.json, the custom controller may get stuck if you run multiple descriptors at the same time. This happens because sometimes the selenium server is not running or not responding.

You must catch the exception while writing the custom controller using webdriver.listener; it throws the exception right away, like this:

::

  webdriver.listener.on("uncaughtException", function (e) {
     errorMsg =  "Uncaught exception: " + e.message;
     self.logger.error(errorMsg);
     callback(errorMsg);
  });

** Note: In order to use this feature you must have arrow version 0.0.67 or higher **


How do I write Traps?
---------------------

What guidelines should I follow when writing Traps?

Solution
========

Follow these guidelines when writing Traps:

    * The module name of the test script module must end with -tests, for example photo-ModuleA-tests.
    * The method name of the test must start with test, for example testCloseByCloseButton.
    * Do NOT write Y.Test.Runner.run() in your test. Use Y.Test.Runner.add(……).
    * Add ALL necessary dependencies into the requires list.

Example code:

::

  YUI.add("photo-ModuleA-tests", function(Y) {
   var suite = new Y.Test.Suite("The description of this test suite");
   var Assert = Y.Assert;
   var lib = Y.Media.Test.Common;   //Include test library
   var lib2 = Y.Media.Test.ModuleA  //Include module-specific test library
   suite.add(new Y.Test.Case({   //Add tests into test suite
    "setUp": function(){},
    "testCloseByCloseButton": function(){……}, //All test methods must start with "test"
    "testCloseByBlackArea": function(){……}
  }));
  Y.Test.Runner.add(suite);
   }, "0.1", {requires:["arrow", "io", "node", "test” …… //Import all necessary dependencies
   "media-test-library-Common", //Import common library
   "media-test-library-ModuleA", //Import module-specific library
  ]});


How to get code coverage on child process?
---------------------

How to get code coverage on child process, if the test code user child_process.spawn to lunch a child process during testing?

Solution
========

Using Arrow built-in YUI module: istanbul-command-runner to spawn child process

    * It will generate coverage for each process under child_process_coverage directory
    * Please note child_process.fork is not supported for this mock module
    * It only support child process on server side testing

Example code:

::

  YUI.add("child-process-tests", function (Y) {
    var suite = new Y.Test.Suite("unit test suite");

    suite.add(new Y.Test.Case({
        "test command runner with istanbul instrument": function() {
            self = this;
            Y.IstanbulCommandRunner.setIstanbulRoot(__dirname + '/lib');
            var cp = Y.IstanbulCommandRunner.spawn(__dirname + '/app/child-app.js', ["--foo"]);
            cp.on('exit',function(code){
                console.log('From parrent: sub exit with ' + code);
            });

            // If this test sessinon finished before above spawned child process exit,
            // seems the child process would be ended, so, please give enough time to
            // wait here
            this.wait(function () {}, 2000);
        }
    }));

    //Note we are not "running" the suite.
    //Arrow will take care of that. We simply need to "add" it to the runner
    Y.Test.Runner.add(suite);
  }, "0.1", {requires:["test", "istanbul-command-runner"]});



How to create multiple selenium sessions and do interation testing
---------------------

For example, to test interaction between 2 Yahoo! Messanger accounts, we need open two selenium sessions to serve page A (for user A), and page B (for user B), then do something like:
    * User A login and goes to page A, user B login and goes to page B;
    * User A send a message to user B on page A;
    * Verify on page B, to confirm the message is got by user B;
    * User B make a comment on the message, on Page B;
    * Verify on page A, to confirm user A can get the comment from user B;

Solution
========

Create a custom controller, and call webdrivermanager.createWebDriver to create webdriver object, like `this <../../tests/functional/data/arrow_test/multisessions/controller-multisessions.js>`_.


