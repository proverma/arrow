==============
Arrow In-Depth
==============

Arrow provides you with a variety of tools to help you organize, execute and configure your tests.

Test Suite Organization
-----------------------

Test descriptor files allow you to organize your tests into test suites, while also allowing you to control when and which tests execute at a given phase of your development cycle.

Consider the following scenario:
You have just finished creating a suite of tests that validate the application we discussed in the `Arrow Tutorial <./arrow_tutorial.rst>`_ chapter.

At this point you have the following test files:

* Functional Tests
* Integration Tests

For this sample, we'll pretend unit tests are being addressed elsewhere.

If you recall, to execute the two test files above against our mock and HTTP endpoint, we'd type something like this:

::

  For globally installed Arrow

   arrow test-func.js  --page=testMock.html --lib=test-lib.js
   arrow test-func.js  --page=http://www.doctor46.com/tabview.html --lib=test-lib.js
   arrow test-int.js  --page=http://www.doctor46.com/tabview.html --lib=test-lib.js

  For locally installed Arrow

   ./node_modules/.bin/arrow test-func.js  --page=testMock.html --lib=test-lib.js
   ./node_modules/.bin/arrow test-func.js  --page=http://www.doctor46.com/tabview.html --lib=test-lib.js
   ./node_modules/.bin/arrow test-int.js  --page=http://www.doctor46.com/tabview.html --lib=test-lib.js

Let's pretend we wanted to easily decide which test files executed and which didn't. Test Descriptors_ allow you to do this easily and in one location

.. _Descriptors:

Test Descriptors
================

Test descriptors provide a way to describe, organize and factorize your tests. During test development, you'll probably execute each test from the Arrow command line. However, once you have created tests to validate your module, you need a way to organize and factorize the tests.

Lets look at this `test descriptor <https://github.com/yahoo/arrow/tree/master/docs/arrow_tutorial/func_test/test/test_descriptor.json>`_.

::

    [
        {
            "settings": [ "master" ],

            "name" : "tabview",

            "commonlib" : "./test-lib.js",

            "config" :{
                "baseUrl" : "http://www.doctor46.com"
            },

            "dataprovider" : {

                "dom" : {
                    "params" : {
                        "test" : "test-func.js",
                        "page" : "testMock.html"
                    },
                    "group" : "unit"
                },

               "dom_int" : {
                    "params" : {
                        "test" : "test-func.js",
                        "page" : "$$config.baseUrl$$/tabview.html"
                      },
                    "group" : "smoke"
                },

                "int" : {
                    "params" : {
                        "test" : "test-int.js",
                        "page" : "$$config.baseUrl$$/tabview.html"
                    },
                    "group" : "smoke"
                }

            }

        },

        {
            "settings": [ "environment:development" ]
        }

    ]


**Suite Settings**

These settings are accessible by all tests in the suite

::

 "name" : "tabview",
 "commonlib" : "./test-lib.js",

name and commonlib

* `name:` Allows you to give your descriptor a name. In Arrow you can run multiple test descriptors in a single execution. Giving it a name allows you to separate the results
* `commonlib:` Behaves like a suite-level `--lib` parameter. Rather than calling each necessary dependency or lib in the tests, you can do that here. `commonlib` is not limited to only one dependency. If you have more than one dependency, you can specify them with commas.

**Suite Configuration**

The settings here, allow you to override default config settings and apply to the entire suite

::

 "config" :{
 "defaultAppHost" : "http://www.doctor46.com"
 },

In this example we have a key called `defaultAppHost`. The value assigned to this key can be picked up using the `$$` annotation, for example  `$$config.defaultAppHost$$`.

This is one way we can parametrize our tests and make them easier to execute/share.

**Individual Test Settings**

This section uses the `Suite Settings` and the `Suite Configuration` to create instances of your tests.

::

    "dom_int" : {
    "params" : {
       "test" : "test-func.js",
          "page" :"testMock.html"
        },
     "group" : "unit"
    },

* The first object is the name of the test. In this case, the test name is `dom_int`.
* The next object, `params`, includes the necessary parameters for the test.
* `test`: Tells Arrow which file to execute
* `page`: Tells Arrow against which page to execute. The `page` value can be a local mock page served by arrow_server, or an HTTP endpoint
* `group`: Allows you to *group* your tests for execution. Each test `file` contains a set of tests or assertions. At the time of creation, tests do not have a context (at least not implied). A `group` gives those test `files` context, enabling you to execute only a given set of tests during a given execution.

Executing using a Test Descriptor
=================================

To Execute *All* tests in a given test descriptor file simply type (remember in this example, the name of our file is `test-descriptor.json`):

::

  arrow test-descriptor.json (For globally installed arrow)
  ./node_modules/.bin/arrow test-descriptor.json (For locally installed arrow)

However, if you wanted to *only* execute tests `grouped` as `func`, you would type:

::

 arrow test-descriptor.json --group=func (For globally installed arrow)
 ./node_modules/.bin/arrow test-descriptor.json --group=func (For locally installed arrow)

Similarly, you can choose to *only* execute a given test, based on its name. You can do that by typing:

::

 arrow test-descriptor.json --testName=dom (For globally installed Arrow)
 ./node_modules/.bin/arrow test-descriptor.json --testName=dom (For locally installed Arrow)


Test Descriptor Best Practices
==============================

One Test Descriptor Per Module
..............................

One test descriptor per module is recommended. You do not need a *parent* test descriptor file to include multiple modules. There are different tools which do this for you. Given a root directory, Arrow traverses the child directories and picks up the required test descriptor files.

For example, suppose you have the following directory structure, and within each module/test folder you have tests and a test descriptor file.

::

  project1
     |____ module1
     |        |_____src
     |        |_____test
     |            |_____test-descriptor1.json
     |
     |____ module2
     |        |_____src
     |        |_____test
     |            |_____test-descriptor2.json
     |
     |____ module3
     |        |_____src
     |        |_____test
     |            |_____test-descriptor3.json
     |
     |____ module4
              |_____src
              |_____test
                  |_____test-descriptor4.json

To execute *All* test descriptor files *within* each module, simply navigate to the project root (in this case `project1`) and type:

::

  arrow "**/*-descriptor.json" (For globally installed Arrow)
  ./node_modules/.bin/arrow "**/*-descriptor.json" (For locally installed Arrow)

Arrow will traverse through all sub-folders, pick up the test descriptors which match ``"**/*-descriptor.json"`` glob, and execute them sequentially.

Parametrize Test Descriptors
............................

There are tests which require parametrization. Specially in *Integration* tests (int), it is important to have a way to parametrize the host name of your AUT.

Test descriptors allow you to parametrize like this:

::

 "dom_int" : {
    "params" : {
       "test" : "test-func.js",
          "page" :"$$config.defaultAppHost$$/tabview.html"
        },
     "group" : "smoke"
 },

 "int" : {
      "params" : {
          "test" : "test-int.js",
          "page" : "$$config.defaultAppHost$$/tabview.html"
      },
      "group" : "smoke"
 }

Where `"defaultAppHost" : "http://doctor46.com"`


Test Descriptor Parametrization and Test Environments
-----------------------------------------------------

So far our parametrization examples have only applied to our current file. If we want to run our tests across different environments (with different hostnames), we'd have to create multiple test-descriptor.json files to do this. However, we can use a `dimension` file to give our parameters additional `dimension` or context.

At the bottom of our test descriptor file there was this line:

::

    {
     "settings": [ "environment:development" ]
    }

We can make use of the line above, and a `dimension` file to dynamically change configuration values given a context.

With this `dimension` file we can set different contexts in our test descriptor:

::

    [
        {
            "dimensions": [
                {
                    "environment":
                    {
                        "development": {
                            "test": null
                        },
                        "integration": {
                            "test": null
                        },
                        "stage": {
                            "test": null
                        },
                        "production": {
                            "test": null
                        }
                    }
                }
            ]
        }
    ]

Now we can update our test descriptor like this

::

    {
        "settings": [ "environment:development" ],

        "config" :{
            "defaultAppHost" : "http://development.com"
        }
    },

    {
        "settings": [ "environment:integration" ],

        "config" :{
            "defaultAppHost" : "http://integration.com"
        }
    },

    {
        "settings": [ "environment:stage" ],

        "config" :{
            "defaultAppHost" : "http://stage.com"
        }
    },

    {
        "settings": [ "environment:production" ],

        "config" :{
            "defaultAppHost" : "http://production.com"
        }
    }

During execution, we can set the context like this:

::

     arrow test-descriptor.json --context=environment:development --dimensions=./dimensions.json (For globally installed Arrow)
     ./node_modules/.bin/arrow test-descriptor.json --context=environment:development --dimensions=./dimensions.json (For locally installed Arrow)

Or

::

     arrow test-descriptor.json --context=environment:stage --dimensions=./dimensions.json (For globally installed arrow)
     ./node_modules/.bin/arrow test-descriptor.json --context=environment:stage --dimensions=./dimensions.json (For locally installed arrow)

In each case, Arrow will take the `context` and `dimensions` file and use those to map the correct `config` value for the current execution



Configuration
-------------
There are various ways to configure Arrow. Normally, Arrow's configuration file will be installed here

.. todo need to update the location for NON-Yahoo Linux.

Configuration Location
======================

+-------+--------------------------------------------------------------------------------+
|MAC    | /usr/local/lib/node_modules/arrow/config/config.js                             |
+-------+--------------------------------------------------------------------------------+
|Linux  | TODO... needs to be updated                                                    |
+-------+--------------------------------------------------------------------------------+
|WIN    | `%USERPROFILE%\\AppData\\Roaming\\npm\\node_modules\\arrow\\config\\config.js` |
+-------+--------------------------------------------------------------------------------+

The standard arrow config file looks like this

::

    var config = {};

    // User default config
    config.seleniumHost = "";
    //example: config.seleniumHost = "http://gridhost:port/wd/hub";
    config.context = "";
    config.defaultAppHost = "";
    config.logLevel = "INFO";
    config.browser = "firefox";
    config.parallel = false;
    config.baseUrl = "";
    // Framework config
    config.arrowModuleRoot = global.appRoot + "/";
    config.dimensions = config.arrowModuleRoot + "config/dimensions.json";
    config.defaultTestHost = config.arrowModuleRoot + "lib/client/testHost.html";
    config.defaultAppSeed = "http://yui.yahooapis.com/3.6.0/build/yui/yui-min.js";
    config.testSeed = config.arrowModuleRoot + "lib/client/yuitest-seed.js";
    config.testRunner = config.arrowModuleRoot + "lib/client/yuitest-runner.js";
    config.autolib = config.arrowModuleRoot + "lib/common";
    config.descriptorName = "test_descriptor.json";

    module.exports = config;

As you can see there are two types of configuration sections:

* User Config: These are configuration parameters which directly affect how your test or test suite will execute
* Framework Config: These are configuration parameters which indirectly affect how your test or test suite will execute

Overriding Configuration Values
===============================

Obviously, you can update the config file to *override* its settings. However, you can also *override* individual config parameters on a per-execution basis. Every config parameter can be *overridden* during execution like this:

::

  arrow or ./node_modules/.bin/arrow <some test or test descriptor> --config=value

Or

::

  arrow or ./node_modules/.bin/arrow <some test or test descriptor> --seleniumHost=http://some.url.com:1234/wd/hub

Or

::

  arrow/ or ./node_modules/.bin/arrow <some test or test descriptor> --logLevel=debug --baseUrl=http://baseurl.com --browser=chrome

You can basically override any config parameter in the command line.

You can also **completely** override all configuration values by placing a config.js file at the root of your execution. Arrow always looks at the current directory for config.js file. If it finds one, it will use **that** file over the default configuration.


Complex Test Scenarios
----------------------

There are situations where the default arrow controller will not allow you to create the type of test scenario you require. If you recall, the default arrow controller assumes the page you load is the page under test. To solve this you can use a different arrow controller called *locator*. The *locator* controller allows you to navigate to the page under test by allowing you to perform actions such as clicking and typing.

The controller samples can be found `here <https://github.com/yahoo/arrow/tree/master/docs/arrow_tutorial/controllers/test>`_.
.. The controller samples can be found `here. - TODO... need the link to the controller samples (@dmitris)

.. TODO... needs to be updated


The Locator Controller
======================

To use the *locator* controller you need to use a test descriptor with an additional node, **scenario**.

Suppose you wanted to test finance.yahoo.com's ticker quotes engine. To do that, you would build a scenario like this:

1. Open http://finance.yahoo.com
2. Use the *locator* controller and look for the *ticker* input textbox and enter *yhoo*
3. Use the *locator* controller and *click* on the submit button
4. Wait for the page to load **and** now test for quotes

Based on the scenario above, our test descriptor file would look like this:

::

  "dataprovider" : {

      "Test YHOO Ticker" : {
          "group" : "func",
          "params" :{
              "scenario": [
                  {
                      "page": "$$config.baseUrl$$"
                  },
                  {
                      "controller": "locator",
                      "params": {
                          "value": "#txtQuotes",
                          "text": "yhoo"
                      }
                  },
                  {
                      "controller": "locator",
                      "params": {
                          "value": "#btnQuotes",
                          "click": true
                      }
                  },
                  {
                       "test": "test-quote.js",
                       "quote": "Yahoo! Inc. (YHOO)"
                  }
              ]
          }
      }
  }

Our first step is to open the page (Arrow will use the *default* controller when none is specified). Secondly we look for an input field with a locator value of *#txtQuotes* and we enter *yhoo*. Then we use the *locator* controller to *click* on *#btnQuotes*. Finally we inject our test JS file and using *this.params,* we pass the value in *quote* to the test file.

Our test continues being a simple YUI test which takes input from the test descriptor in order to do its validation

::

 YUI({ useBrowserConsole: true }).use("node", "test", function(Y) {
     var suite = new Y.Test.Suite("Quote Page test of the test");
     suite.add(new Y.Test.Case({
         "test quote": function() {

             //In order to parametrize this, instead of having a static quote, we call it from the config
             var quote = this.testParams["quote"];
             Y.Assert.areEqual(quote, Y.one(".yfi_rt_quote_summary").one("h2").get('text'));
         }
     }));

     Y.Test.Runner.add(suite);
 });

To execute we simply type the following:

::

 arrow test-descriptor.json --driver=selenium (For globally installed Arrow)
 ./node_modules/.bin/arrow test-descriptor.json --driver=selenium (For locally installed Arrow)

As you can see, the *locator* controller is quite powerful. It can take the following *params*

* **value**: locator value
* **click**: true or false
* **text**: value ot enter
* **using**: by default, Arrow will assume you want to use *css* locators for *value*. However you can use any **By** strategy supported by WebDriver: className, id, linkText, name, text, xpath, etc.

For example, you could have the following in your test descriptor

::

  {
      "controller": "locator",
      "params": {
          "using": "xpath",
          "value": "//*[@id="btnQuotes"]",
          "click": true
      }
  }

Complex Test Runner(engine) Support
-----------------------------------
Arrow default support tests/libs written in YUI which may limit the usage as a test framework.
With test engine extension arrow now has been able to support some other test cases like BDD/TDD/QUnit besides YUI:
     * Any test cases written in YUI,QUnit,BDD(mocha or jasmine style),TDD(mocha style) can be run in server side(node environment).
     * Any test cases written in YUI,QUnit,BDD(mocha or jasmine style),TDD(mocha style) can be run in client side(in multiple browser) with selenium and web-driver without any extra effort.

Users can run multiple test cases and runner simply by specify engine using --engine=yui/mocha/jasmine/qunit ...

Using --engine in arrow cmd
===========================
Suppose you have a test case written in the popular BDD way,like:

::

describe('Array', function(){
	describe('#push()', function(){
		it('should return the length', function(){
			var arr = [],
			 assert = function(expr, msg) {
            	if (!expr) throw new Error(msg || 'failed');
            }
			assert(1 == arr.push('foo'));
			assert(2 == arr.push('bar'));
			assert(3 == arr.push('baz'));
		})
	})
})

Then you can use test runner mocha to run it ,for example:

::

 arrow mocha-bdd.js --engine=mocha (For globally installed Arrow)
 ./node_modules/.bin/arrow mocha-bdd.js --engine=mocha (For locally installed Arrow)


And if you want to run it in client side ,just simply run :

::

 arrow mocha-bdd.js --engine=mocha --browser=chrome (For globally installed Arrow)
 ./node_modules/.bin/arrow mocha-bdd.js --engine=moch --browser=chrome (For locally installed Arrow)

 arrow mocha-bdd.js --engine=mocha --browser=phantomjs --page=http://serach.yahoo.com (For globally installed Arrow)
 ./node_modules/.bin/arrow mocha-bdd.js --engine=mocha --browser=phantomjs --page=http://serach.yahoo.com (For locally installed Arrow)

We can see that you just need to focus on how to implement test cases itself but no need to worry how to test it in server/client side,arrow will take care of it and set up test environment for you.

Suppose you have a test case written in tdd way and you want to use chai as assertion :

::

suite('Array', function(){
	suite('#indexOf()', function(){
		test('should return -1 when not present', function(){
		    var chai;
            if(typeof window  == "undefined" && typeof chai  == "undefined"){
            		chai = require('chai');
            }
            else{
            		chai = window.chai;
            }
			chai.assert(-1 == [1,2,3].indexOf(4));
		});
	});
});

then you can still want mocha run it but using different "interface" in mocha like this:

::

 arrow mocha-bdd.js --engine=mocha --engineConfig=./config.josn (For globally installed Arrow)
 ./node_modules/.bin/arrow mocha-tdd.js --engine=mocha  --engineConfig=./config.josn(For locally installed Arrow)

 or in browser side:

 arrow mocha-bdd.js --engine=mocha --engineConfig=./config.josn  --browser=chrome (For globally installed Arrow)
 ./node_modules/.bin/arrow mocha-tdd.js --engine=mocha  --engineConfig=./config.josn  --browser=chrome (For locally installed Arrow)

you can define any configuration recognized by mocha like "ui","reporter" etc. in config.json:

::

{"ui":"tdd","require":"chai"}

It will be passed to test engine and take effect in test execution.

NOTE: Here we support chai as mocha's offical assertion set.Users just need to add it to "require" field in engine config,
      Also npm package or http links are supported,arrow will take case to require it in node side or load the js in browser side:

::

{"ui":"tdd","require":["chai","should","http://chaijs.com/chai.js"]}

Using engine in arrow's test descriptor
=======================================

If you have multiple style test cases and want to test it in one test descriptor ,you just need to specify which engine to use in descriptor:

::

[
    {
        "settings":[ "master" ],
        "name":"hybrid engine server side",
        "dataprovider":{
            "mocha":{
                "params":{
                    "test":"mocha-bdd.js",
                    "engine":"mocha"
                },
                "group":"unit"
            },
            "mocha-tdd":{
                "params":{
                    "test":"mocha-tdd.js",
                    "engine":"mocha",
                    "engineConfig":"./mocha-config.json"
                },
                "group":"unit"
            },
            "jasmine":{
                "params":{
                    "test":"jasmine-bdd-test.js",
                    "engine":"jasmine"
                },
                "group":"unit"
            },
            "qunit":{
                "params":{
                    "test":"qunit-test.js",
                    "engine":"qunit"
                },
                "group":"unit"
            },
            "yui":{
                "params":{
                    "test":"yui-test-unit.js",
                    "lib":"./yui-lib.js"
                },
                "group":"unit"
            }
        }
    }
]

Here qunit-test.js and jasmine-bdd-test.js are test cases can be run within qunit and jasmine.By default arrow will use yui to run tests,so in test "yui" ,
we didn't need to specify the engine for test yui-test-unit.js.

Test engine can also works well with arrow controller:

::

[
    {
        "settings": [ "master" ],
        "name": "YahooLogin",
        "config": {
            "baseUrl": "http://login.yahoo.com"
        },
        "commonlib" : "./mocha-lib.js",
        "dataprovider" : {
            "Use Locator to Login" : {
                "group" : "func",
                "browser":"chrome",
                "params" :{
                    "scenario": [
                        {
                            "page": "$$config.baseUrl$$"
                        },
                        {
                            "controller": "locator",
                            "params": {
                                "value": "#username",
                                "text": "arrowtestuser1"
                            }
                        },
                        {
                            "controller": "locator",
                            "params": {
                                "value": "#passwd",
                                "text": "123456"
                            }
                        },
                        {
                            "controller": "locator",
                            "params": {
                                "value": "#submit",
                                "click": true
                            }
                        },
                        {
                            "page": "http://search.yahoo.com/"
                        },
                        {
                            "test": "mocha-test.js",
                            "engine":"mocha"
                        }
                    ]
                }
            }
        }
    }
]

In this test,arrow will use the controller/locator to find elements in login page and after that it will go to search page to run a mocha-style test.
users can add any kind of test cases only if test runner is specified with "engine" field.

Re-Using Browser Sessions
-------------------------

As you develop your tests, you may find it necessary to *test* them against a real browser, such as those supported by Selenium. However, one of the disadvantages of this approach is that normally, for each test file, a new browser session is started and stopped. This is time consuming and counter-productive during development.

Arrow supports the concept of **Session Reuse**.

Using Session-Reuse
===================

Webdriver has a concept of sessions. Once a Selenium/WebDriver server instance is running, you can tell Selenium to *reuse* a given session. This is a very powerful and helpful idea because:

* It expedites execution since a new browser window does not need to be instantiated. This greatly cuts down on execution time and puts *real* browser test execution time in-par with PhantomJS
* As a developer, you can tell Selenium to *use* your preferred *profile* for the session. This means that if you have special plugins (such firebug, or developer tools, etc) installed, you can make use of them during test execution.

However, one should keep in mind that this approach means your test will have a sterile environment as session and cookie information will be **reused**

To use *Session-Reuse* do the following:

1. From within the machine running Selenium server go to: http://localhost:4444/wd/hub/static/resource/hub.html
2. Click on *create session* and choose the browser you want
3. A new Browser will start (that is your session) and set itself to a blank page
4. To tell Arrow to **Reuse** that session type:

::

  arrow <some test or test descriptor> --reuseSession=true

Arrow will contact the Selenium Server in the config and will ask it if there are any *reusable* sessions. If so, it will direct all tests to them.

Note Arrow will direct all tests to **ALL OPEN** sessions. If you want to further expedite your test execution time, you can start sessions for different browser and Arrow will execute your tests in parallel against all of them.

Using Session-Reuse With Specific Profiles
==========================================

If you want to *reuse* your default profile, or a specific profile you use for developing simply type this when you start Selenium server

::

 java -Dwebdriver.firefox.profile=default -jar ./path/to/selenium/sever.jar

Or

::

 java -Dwebdriver.firefox.profile=profile_name -jar ./path/to/selenium/sever.jar

Once Selenium is started, the same steps for *reusing* sessions apply.

Auto scan share libraries and controllers
---------

A test case might need use some share libraries. The arrow command line option: ``--lib`` can be used to load the share lib module, but, for complex test case, it might need load a lot of share lib modules which is installed in many places, it would be hard to maintain such a long ``--lib`` list.

The share library auto scanner makes it simple.

Arrow provides a configuration item: config.scanShareLibPath to set scan path, or by command line option: ``--shareLibPath``, which will override configuration. Use comma to seperate if want to specify more than one directory to scan.

Once share lib path is set, when arrow is launched, it will recursively search the YUI module (.js file) under the given path (directory), and follows the subfolder name convention as below:

* directory name starts with a prefix like "martini_";
* subfolder: lib for share libraries;
* subfolder: lib/server for share libraries can be loaded on server side;
* subfolder: lib/client for share libraries can be loaded on client side;
* subfolder: lib/common for share libraries can be loaded on both server side and client side;
* subfolder: controller for custom controllers;
* there can be subfolders under above folders, and arrow will scan them recursively.

::

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

The module under client directory will be registered as client module, the module under server directory will be registered as server module, the module under common directory will be registered as both client and server module. The controller directory is for custom controller.

Arrow will register the share libraries which followed above directory layout convention, as server side modules, client side modules, or custom controllers,  then we can still use common methods to load these module as other YUI Gallery modules in our test code, like YUI().use('module') or YUI.add(xxx ... require('module')), arrow would find and load the required module for it. 

For custom controller, arrow will add "package_name." as prefix, like for above sample, then to specify custom controller in test descriptor, we can use controller path, or use "martini_lib1.my-sample-controller" instead.

How To Use ``--shareLibPath``
==========
1. Find or create a npm package which has share library and followed above convention, install it locally or globally, for example

::

  npm install martini_testlib1 -g

2. specify the install path to ``--shareLibPath``

::

  arrow test-unit.js --shareLibPath=/usr/local/lib/node_modules/martini_testlib1

If installed more than one share lib packages globally, like martini_testlib2, we can specify multiple paths to ``--shareLibPath``, or specify the parent folder to ``--shareLibPath``.

::

  arrow test-unit.js --shareLibPath=/usr/local/lib/node_modules/martini_testlib1,/usr/local/lib/node_modules/martini_testlib2
  arrow test-unit.js --shareLibPath=/usr/local/lib/node_modules/

3. use constom controller. In test descriptor, now we can use package_name.controller_name in **controller** node, as below:

::

  "controller": "martini_testlib1.my-test-controller"

**Note:**
1. if want to let ``--shareLibPath`` to scan some directory other than martini_xxx, you can configure
 it on */path/to/arrow/install/path/config/config.js*, for example, to scan dev_xxx directory, you can configure it as below:

::

  config.scanShareLibPrefix = ["martini_", "dev_"];

2.Another config is config.scanShareLibRecursive , if set to false, arrow will only scan top level folders for the given prefix and given scan path,Otherwise it will scan recursively with the given path.

3.And the next config: config.enableShareLibYUILoader ,this is important configuration,
 By default false ,arrow will inject all necessary share lib source code into test cases .
 If true, arrow will generate and inject YUI group/modules info and let YUI loader to load modules.To ensure YUI loader to get these modules,arrow will auto detect if arrow server is running and will restart it for YUI loader if not.
 The reason we need this switch is because in yahoo network lot of time lab manager windows VM's don't have access to any non-80 port of hudson slaves.In those scenarios, YUI config would be a blocker and YUI loader wont work.So if you can make sure the pages
 you are testing have access to your host where arrow server runs, you can make enableShareLibYUILoader true to improve performance.

 ::
 arrow test-unit.js --shareLibPath=/usr/local/lib/node_modules/ --enableShareLibYUILoader=true

Parallelism
-----------

Arrow supports Parallel execution of tests. By default **parallel** is set to *false*. You can update the value to the *maximum number* of threads you want to use. Keep in mind Arrow will try to create one Browser Session **PER** parallel count. It is important that you have enough system resources to support this

How To Use
==========

::

  arrow <some test or test descriptor> --parallel=N

Or

::

  arrow <some test or test descriptor> --parallel=5


Reporting
---------

Arrow supports two reporting formats, the ever-popular JUnit.xml format and Arrow's own JSON format. Reporting is particularly important if you use test descriptors to execute your tests, because each test.js file will have its own set of results. However, using Arrow's reporting feature will merge the individual results into one report.

How To Use
==========

To tell Arrow you would like to create reports simply type:

::

  arrow <some test or test descriptor> --report=true

After the test executes two files will be created under the location from which you executed Arrow; *report.xml* and *report.json*.

Running multiple descriptors using ``'arrow "**/*-descriptor.json" --report=true'`` , will create report.xml and report.json under directory structure where each descriptor files reside.

Hudson supports report globbing, so you can pass ``**/test-descriptor-report.xml``, and it will pick up all your result files.

report.xml sample
.................

::

   <testsuite failures='0' time='26.14' errors='0' skipped='0' tests='1' name='controllers'>
       <properties>
           <property name='descriptor' value='test-descriptor.json'/>
       </properties>
       <testcase time='10' classname='Test YHOO Ticker.testCaseyui_3_2_0_18_133850857473827' name='test quote'/>
   </testsuite>



report.json sample
..................

::

  [
      {
          "passed":1,
          "failed":0,
          "total":1,
          "ignored":0,
          "duration":15,
          "type":"report",
          "name":"Quote Page test of the test",
          "testCaseyui_3_2_0_18_133850857473827":{
              "passed":1,
              "failed":0,
              "total":1,
              "ignored":0,
              "duration":10,
              "type":"testcase",
              "name":"testCaseyui_3_2_0_18_133850857473827",
              "test quote":{
                  "result":"pass",
                  "message":"Test passed",
                  "type":"test",
                  "name":"test quote",
                  "duration":1
              }
          },
          "timestamp":"Thu May 31 16:56:33 2012",
          "ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:12.0) Gecko/20100101 Firefox/12.0",
          "testName":"Test YHOO Ticker"
      }
  ]
