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

To execute *All* tests in a given test descriptor file, simply type (remember in this example, the name of our file is `test-descriptor.json`):

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


replaceParamJSON
--------------------
This parameter is optional and can be used when user wants to configure descriptors to replace certain values on the fly.

It could either be passed as .json object or as a string in json format.

replace.json sample
====================

::

    {
        "property" : "finance"
    }


The descriptor will appear as follows for the given replace.json

descriptor.json sample
=======================

::

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

Now, if user runs the descriptor

::

    arrow ./descriptor.json --replaceParamJSON=./replace.json --browser=firefox
    or
    arrow ./descriptor.json --replaceParamJSON='{"property":"finance"}' --browser=firefox

The value of ``'baseUrl'`` which is ``'http://${property}$.yahoo.com'`` will become ``'http://finance.yahoo.com'``


defaultParamJSON
--------------------
This parameter is optional and can be used when user wants to use default values for the parameters which are not specified in replaceParamJSON.
If user has specified replaceParamJSON and the value is not found in replaceParamJSON , it looks for the value in defaultParamJSON.

It could either be passed as .json object or as a string in json format.

default.json sample
====================

::

    {
        "property" : "finance",
        "site" : "yahoo"
    }

replace.json sample
====================

::

    {
        "property" : "news"
    }


The descriptor will appear as follows for the given replace.json

descriptor.json sample
=======================

::

    [
          {
                 "settings":[ "master" ],
                 "name":"descriptor",
                 "config":{
                            "baseUrl": "http://${property}$.${site}.com"
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

Now, if user runs the descriptor

::

    arrow ./descriptor.json --replaceParamJSON=./replace.json --defaultParamJSON=./default.json --browser=firefox
    or
    arrow ./descriptor.json --replaceParamJSON='{"property":"news"}' --defaultParamJSON='{"property":"finance","site":"yahoo"}' --browser=firefox

The value of ``'baseUrl'`` which is ``'http://${property}$.${site}.com'`` will become ``'http://news.yahoo.com'``

If user only passes defaultParamJSON,

::
    arrow ./descriptor.json --defaultParamJSON=./default.json --browser=firefox
    or
    arrow ./descriptor.json --defaultParamJSON='{"property":"finance","site":"yahoo"}' --browser=firefox

The value of ``'baseUrl'`` which is ``'http://${property}$.${site}.com'`` will become ``'http://finance.yahoo.com'``


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
* **hover**: true or false
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




The Custom Controller
======================

User can write custom controller if the requirement is not getting fulfilled by the locator controller. It does support all the latest webdriver methods.

For example, given below is the finance-controller.js which does similar to what we just explained in the locator controller sample.

Based on the scenario above, our test descriptor file would look like this:

::

    var util = require("util");
    var log4js = require("yahoo-arrow").log4js;
    var Controller = require("yahoo-arrow").controller;

    function FinanceCustomController(testConfig,args,driver) {
       Controller.call(this, testConfig,args,driver);

       this.logger = log4js.getLogger("FinanceCustomController");
    }

    util.inherits(FinanceCustomController, Controller);

    FinanceCustomController.prototype.execute = function(callback) {
       var self = this;

       if(this.driver.webdriver){

           //Get the various parameters needed from the Test Descriptor file
           var txtLocator =  this.testParams.txtLocator;
           var typeText =  this.testParams.typeText;
           var btnLocator =  this.testParams.btnLocator;
           var page = this.testParams.page;

           //Get a handle of the WebDriver Object
           var webdriver = this.driver.webdriver;

           //Open the page you want to test
           webdriver.get(page);
           webdriver.waitForElementPresent(webdriver.By.css(txtLocator));
           //Navigate the page as necessary
           webdriver.findElement(webdriver.By.css(txtLocator)).sendKeys(typeText);
           webdriver.findElement(webdriver.By.css(btnLocator)).click();
           webdriver.waitForElementPresent(webdriver.By.css(".title")).then(function() {
               self.driver.executeTest(self.testConfig, self.testParams, function(error, report) {
                   callback();
               });

           });
       }else{
           this.logger.fatal("Custom Controllers are currently only supported on Selenium Browsers");
           callback("Custom Controllers are currently only supported on Selenium Browsers");
       }
    }

    module.exports = FinanceCustomController;

The descriptor for the custom controller will be little different since we need the params to be passed from it and it looks like,

::

    [
       {
           "settings":[ "master" ],

           "name":"controllers",

           "config":{
               "baseUrl":"http://finance.yahoo.com"
           },

           "dataprovider":{

               "Test YHOO Ticker using Finance Controller":{
                   "group":"func",
                   "controller":"finance-controller.js",
                   "params":{
                       "page":"$$config.baseUrl$$",
                       "txtLocator":"#txtQuotes",
                       "typeText":"yhoo",
                       "btnLocator":"#btnQuotes",
                       "test":"test-quote.js",
                       "quote":"Yahoo! Inc. (YHOO)"
                   }
               }
           }
       },
       {
           "settings":[ "environment:development" ]
       }
    ]

Custom controller best practice

1.    Make sure to include “var log4js = require(“yahoo-arrow”).log4js;” and “var Controller = require(“yahoo-arrow”).controller” to access yahoo-arrow.
2.    Make sure to include “waitForElementPresent(webdriver.By.css(”.title”))” before calling the callback() to return to the test or else sometime, “ARROW is not defined” error will appear since the test try to execute before even loading the page completely.


Test Engine
-----------------------------------

Internally, test engine is an adaptor to support different styles test cases, like YUI, QUnit, BDD, TDD.

By default, Arrow is using YUI style testing. It can be changed by specifying ``--engine``, with below supported:
* yui (default)
* mocha
* jasmin
* qunit

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

Then you can use test engine mocha to run it ,for example:

::

 arrow mocha-bdd.js --engine=mocha (For globally installed Arrow)
 ./node_modules/.bin/arrow mocha-bdd.js --engine=mocha (For locally installed Arrow)


And if you want to run it in client side ,just simply run :

::

 arrow mocha-bdd.js --engine=mocha --browser=chrome (For globally installed Arrow)
 ./node_modules/.bin/arrow mocha-bdd.js --engine=moch --browser=chrome (For locally installed Arrow)

 arrow mocha-bdd.js --engine=mocha --browser=phantomjs --page=http://serach.yahoo.com (For globally installed Arrow)
 ./node_modules/.bin/arrow mocha-bdd.js --engine=mocha --browser=phantomjs --page=http://serach.yahoo.com (For locally installed Arrow)


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

NOTE: This example shows that we just need to add chai to "require" field in engine config to support chai as mocha's offical assertion set.
      Also npm package or http links are supported in engine config.

::

{"ui":"tdd","require":["chai","should","http://chaijs.com/chai.js"]}

Using engine in arrow's test descriptor
=======================================

If you have multiple style test cases and want to test it in one test descriptor ,you just need to specify which engine to use in descriptor:

::

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

Here qunit-test.js and jasmine-bdd-test.js are test cases can be run within qunit and jasmine. By default arrow will use yui to run tests,so in test "yui" ,
we didn't need to specify the engine for test yui-test-unit.js.

Test engine can also works in scenario node:

::

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

In this test, arrow will use the locator controller to find elements in login page and after that it will go to search page to run a mocha-style test.
Users can add any kind of test cases only if the related test engine is suppported and specified with "engine" field.


YUI abstraction (YUI sandboxing)
--------------------------------

Most of yahoo pages are built on YUI, if you are writing YUI test case testing against YUI pages, then YUI sandbox has great benefit with below scenarios:

* The testing page builds on a lower YUI version (YUI@2.x or 3.x) .
* The page has some restriction for YUI loader to fetch external modules (like mojito apps).
* Simply you don't want to let test case affect the page or the features.

Then you can use YUI sandbox to test your code.

How to use
======================
you can simply modify arrowRoot/config/config.js to make sandbox to true, or pass from command line:

::

    config.useYUISandbox = true  or   --useYUISandbox=true


Also you can figure whatever YUI version you want by config.sandboxYUIVersion or --sandboxYUIVersion, by default it will use the same version as yui in arrow/node_modules, and it is what we recommanded.

Not to use
======================
However under some situations that you should NOT use YUI sandbox:

* Your test cases requires yui modules only served on the test page, for example:

::

    YUI.add('example-tests',function(Y){...},'1.0.0', { requires: [ 'node' ] });,

And 'example-module' is only served in test-page.html, then the page level YUI should be used instead of YUI in a sandbox.

Sandbox detail(Advanced)
========================
Suppose we have a yui test case and also have some test libs written as YUI.add(…), then we will warp all these in IEFF(immediately executed factory function).

::

    (function () {
        var YUI;
        ... //  1. all yui min/base goes here...
        YUI.add(...)  // 2. all yui core modules goes here
        YUI.add/use(...) // 3. custom's yui libs and yui tests goes here
        YUITest/TestRunner... // 4. yui test runner start.
    })();

So that this sandbox(IEFF) contains all:  yui seed, yui core modules(auto resolved from test case/test libs), test libs, test cases and test engine... 
It is an absolute YUI instance and does't depend (or mess with) the YUI on test page.

Sharing test parameters among custom controllers and tests in a scenario node
-------------------------

In a complex test scenario, we maybe need multiple controllers or tests in a scenario node. Arrow provides a way to share variables among the controllers or tests, via this.testParams.shared.
Custom controller or test can set a Json object to this.testParams.shared, then it will pass to downstream controllers and tests.

The sample of sharing testParams from a test to another test can be found `here <https://github.com/yahoo/arrow/tree/master/tests/functional/data/arrow_test/share_test_params/test_params_share-simple.json>`_.
The sample of sharing testParams for a custom controller to downstream custom controller and test can be found `here <https://github.com/yahoo/arrow/tree/master/tests/functional/data/arrow_test/share_test_params/search-descriptor-test-params.json>`_.

Re-Using Browser Sessions
-------------------------

As you develop your tests, you may find it necessary to *test* them against a real browser, such as those supported by Selenium. However, one of the disadvantages of this approach is that normally, for each test file, a new browser session is started and stopped. This is time consuming and counter-productive during development.

Arrow supports the concept of **Session Reuse**.

Using Session-Reuse
===================

Webdriver has a concept of sessions. Once a Selenium/WebDriver server instance is running, you can tell Selenium to *reuse* a given session. This is a very powerful and helpful idea because:

* It expedites execution since a new browser window does not need to be instantiated. This greatly cuts down on execution time and puts *real* browser test execution time in-par with PhantomJS
* As a developer, you can tell Selenium to *use* your preferred *profile* for the session. This means that if you have special plugins (such firebug, or developer tools, etc) installed, you can make use of them during test execution.

However, one should keep in mind that this approach means your test will have a non-sterile environment as session and cookie information will be **reused**

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

Using Different Browsers
------------------------
Arrow supports all selenium browsers including phantomjs.

Running tests using single browser
----------------------------------
Assuming you have selenium server already running on localhost port 4444.

::

    arrow ./int/test-descriptor.json --browser=firefox
    arrow ./int/test-descriptor.json --browser=chrome

Assuming you have phantomjs already running on localhost port 4445.

::

   arrow ./int/test-descriptor.json --browser=chrome

Running tests using multiple browsers
-------------------------------------

::

    arrow ./int/test-descriptor.json --browser=firefox,chrome
    arrow ./int/test-descriptor.json --browser=chrome,phantomjs

Running tests on remote host
----------------------------
All above tests can also run on remote host by specifying ‘–seleniumHost’ and ‘–phantomHost’.

::

    arrow ./int/test-descriptor.json --seleniumHost='http://x.x.x.x:4444/wd/hub' --browser=chrome

    arrow ./int/test-descriptor.json --phantomHost='http://x.x.x.x:4445/wd/hub' --browser=phantomjs

    arrow ./int/test-descriptor.json --phantomHost='http://x.x.x.x:4445/wd/hub' --seleniumHost='http://x.x.x.x:4444/wd/hub' --browser=phantomjs,chrome



Using Proxy
-----------

Features of Arrow Proxy server
==============================

User will need to use proxy for following reasons,

* When user wants to redirect page to specific box

* When user wants to verify that certain calls are happening for a given URL

* When user wants to manipulate headers, This can be helpful replacing parameter such as user-agent

Using --startProxyServer
=========================

--startProxyServer param is used to start the proxy as soon as the test runs. It is defined at descriptor level.

The descriptor will look something like this after adding this param.

simple-proxy-descriptor.json
.............................

::

 [
    {
        "settings": [ "master" ],

        "name" : "descriptor",

        "startProxyServer" : true,

        "config" :{
            "baseUrl" : "http://www.yahoo.com"
        },

        "dataprovider" : {

            "dom" : {
                "params" : {
                    "test" : "test-yahoo.js",
                    "page" : "$$config.baseUrl$$"
                },
                "group" : "int"

            }

        }

    },

    {
        "settings": [ "environment:development" ],
        "config": {
            "baseUrl": "http://news.yahoo.com"
        }
    },
    {
        "settings": [ "environment:production" ],
        "config": {
            "baseUrl": "http://sports.yahoo.com"
        }
    }


 ]

Note: This parameter can be passed from the command line, using --startProxyServer=true depending upon your need. Always the one passed from command line will take precedence over the one which is set inside the descriptor

This will create a proxy.log file at the descriptor level.

Using --routerConfigProxy
=========================

--routerConfigProxy param is used to route the traffic of a page to a specific host/box. It refers to router.json file which contains the host to which you want to enroute your traffic for a given url.

This param is defined inside the descriptor file.

router-proxy-descriptor.json
.............................

::


 [
    {
        "settings": [ "master" ],

        "name" : "descriptor",

        "startProxyServer" : true,

        "routerProxyConfig" : "./router.json",

        "config" :{
            "baseUrl" : "http://www.autos.yahoo.com"
        },

        "dataprovider" : {

            "dom" : {
                "params" : {
                    "test" : "test-one-yahoo.js",
                    "page" : "$$config.baseUrl$$"
                },
                "group" : "int"

            }

        }

    },

    {
        "settings": [ "environment:development" ],
        "config": {
            "baseUrl": "http://news.yahoo.com"
        }
    },
    {
        "settings": [ "environment:production" ],
        "config": {
            "baseUrl": "http://sports.yahoo.com"
        }
    }


 ]

router.json
............

::


  {
     "autos.yahoo.com" : "x.x.x.x",
     "yahoo.com" : {
         "newHost" : "y.y.y.y"
     }
   }


For given descriptor it will route all the requests for http://www.autos.yahoo.com to the host x.x.x.x [ Replace x.x.x.x with actual host name]

Using record:true with --routerConfigProxy
==========================================

Inside router.json file record:true param can be used in cases where user wants to confirm that certain calls are happening while loading some URLs.

The descriptor will look like this

proxy-record-controller-descriptor.json
........................................

::

 [
    {
        "settings":[ "master" ],

        "name":"controllers",

        "startProxyServer" : true,

        "routerProxyConfig" : "./data/arrow_test/proxy_test/router.json",

        "config":{
            "baseUrl":"http://sports.yahoo.com"
        },

        "dataprovider":{

            "Test proxy Controller":{
                "group":"func",
                "controller":"./proxy-controller-record.js",
                "params":{
                    "page":"$$config.baseUrl$$",

                    "test":"./test-proxy.js"

                }
            }
        }
    },
    {
        "settings":[ "environment:development" ]
    }
 ]


The only change has to happen in router.json is to include record:true,

router.json
............

::

 {
    "finance.yahoo.com" : {
        "newHost" : "x.x.x.x",
        "record" : true
    }
 }

The recorded traffic can be read from the controller using self.getProxyRecord() as a string. The record can be reset by invoking self.resetProxyRecord().

Note: The proxy record is per routerProxyConfig. If multiple tests use same routerProxyConfig and the tests are run in parallel, using resetProxyRecord() might end up resetting proxy record for other test.

Example -

::

    var util = require("util");
    var log4js = require("yahoo-arrow").log4js;
    var Controller = require("yahoo-arrow").controller;

    function ProxyCustomController(testConfig,args,driver) {
        Controller.call(this, testConfig,args,driver);
        this.logger = log4js.getLogger("ProxyCustomController");
    }

    util.inherits(ProxyCustomController, Controller);

    ProxyCustomController.prototype.execute = function(callback) {
        var self = this;
        self.resetProxyRecord(); // Reset the proxy record

        if(this.driver.webdriver){

            var page = this.testParams.page;
            var webdriver = this.driver.webdriver;

            webdriver.get(page);

            webdriver.waitForElementPresent(webdriver.By.css(".title")).then(function() {

                var record = JSON.parse(self.getProxyRecord()); // Get the proxy record

                self.testParams.proxyManagerRecord=record;
                self.driver.executeTest(self.testConfig, self.testParams, function(error, report) {
                    callback(error);
                });

            });
        }else{
            this.logger.fatal("Custom Controllers are currently only supported on Selenium Browsers");
            callback("Custom Controllers are currently only supported on Selenium Browsers");
        }
    }

    module.exports = ProxyCustomController;

    The record object has 4 fields -
    1) url - Request Url
    2) headers - Request Headers
    3) responseHeaders - Response Headers
    4) method - HTTP method

    e.g
    {
            "url": "http://finance.yahoo.com/",
            "headers": {
                "host": "finance.yahoo.com",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:23.0) Gecko/20100101 Firefox/23.0",
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "accept-language": "en-US,en;q=0.5",
                "accept-encoding": "gzip, deflate",
                "connection": "keep-alive",
                "reqUrl": "http://finance.yahoo.com/",
                "protocol": "http:"
            },
            "responseHeaders": {
                "age": "0",
                "cache-control": "max-age=0, private",
                "connection": "Keep-Alive",
                "content-encoding": "gzip",
                "content-type": "text/html;charset=utf-8",
                "date": "Fri, 22 Nov 2013 01:03:23 GMT",
                "expires": "-1",
                "p3p": "policyref=\"http://info.yahoo.com/w3c/p3p.xml\", CP=\"CAO DSP COR CUR ADM DEV TAI PSA PSD IVAi IVDi CONi TELo OTPi OUR DELi SAMi OTRi UNRi PUBi IND PHY ONL UNI PUR FIN COM NAV INT DEM CNT STA POL HEA PRE LOC GOV\"",
                "server": "YTS/1.20.10",
                "set-cookie": [
                    "B=3mj6nk998tbar&b=3&s=il; expires=Mon, 23-Nov-2015 01:03:23 GMT; path=/; domain=.yahoo.com"
                ],
                "transfer-encoding": "chunked",
                "via": "http/1.1 yts41.global.media.gq1.yahoo.com (ApacheTrafficServer/3.2.0 [cMsSf ]), HTTP/1.1 r7.ycpi.lax.yahoo.net UserFiberFramework/1.0 ",
                "x-frame-options": "SAMEORIGIN",
                "x-yahoo-request-id": "cebg82h98tbar"
            },
            "method": "GET"
        }

Using header manipulation with --routerConfigProxy
===================================================

Sometimes user wants to manipulate headers when calling certain urls. It can be done from router.json as shown below.

router-header.json
...................

::

 {
    "sports.yahoo.com" : {
        "headers" : [
            {
                "param" : "User-Agent",
                "value" : "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_2_1 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5"
            }
        ],
        "newHost" : "x.x.x.x",
        "record" : true
    }
 }

This will pass the value of param 'User-Agent' to the specified value for 'sports.yahoo.com' and runs the test for iphone user-agent.





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

After the test executes two files will be created - *<descriptor name>-report.xml* and *<descriptor name>-report.json*.

Running multiple descriptors using ``'arrow "**/*-descriptor.json" --report=true'`` , will create <descriptor name>-report.xml and <descriptor name>-report.json for each descriptor.

If "reportFolder" is passed .eg . --reportFolder=/reportPath/, the reports will be generated under /reportPath/arrow-report. Under "arrow-report", Arrow creates a directory structure similar to that for descriptors.
e.g if the descriptors being run are dir1/descriptor1.json and dir2/descriptor.json, the corresponding reports will be stored under /reportPath/arrow-report/dir1/ and /reportPath/arrow-report/dir2/ respectively.
A summarized report is also created by the name "arrow-test-summary" in both xml and json formats under /reportPath/arrow-report directory. In addition, a time report is generated in json format which shows the time taken for each descriptor to complete as well as the time taken by each test within the descriptor.

If "reportFolder" is not passed, the reports are generated under "arrow-target" directory e.g "arrow-target/arrow-report" wrt the location from which you executed Arrow.

Hudson supports report globbing, so you can pass ``**/*-report.xml``, and it will pick up all your result files.

If --report is set to true,screenshots are created under "arrow-target/arrow-report/screenshots" directory ( if --reportFolder is not set) or under {reportFolder}/arrow-report/screenshots directory.
If --report is not set to true, screenshots are created under "screenshots" directory wrt the location where the tests are executed from.

By default, Arrow deletes the reports directory ( if exists) created from the previous run, before the tests are executed. If you dont want to overwrite the reports from previous run, use --keepTestReport=true.
Note: This will only keep the reports for a descriptor from the previous run, if that descriptor is not part of current run. The summary and time reports will always get overwritten.


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

timeReport.json sample
..................

::

    { "descriptors":[
        {
            "descriptor":"descriptors/test-descriptor-1.json",
            "time":"9.15 seconds",
            "tests":[
                {
                    "Testname":"Test YAHOO Search 1",
                    "Time":"5.21 seconds"
                } ,
                {
                    "Testname":"Test YAHOO Search 2",
                    "Time":"3.94 seconds"
                }
            ]
        } ,
        {
            "descriptor":"descriptors/test-descriptor-2.json",
            "time":"3.55 seconds",
            "tests":[
                {
                    "Testname":"Test YAHOO Search 3",
                    "Time":"3.55 seconds"
                }
            ]
        } ,
        {
            "descriptor":"descriptors/test-descriptor-3.json",
            "time":"3.33 seconds",
            "tests":[
                {
                    "Testname":"Test YAHOO Search 4",
                    "Time":"3.33 seconds"
                }
            ]
        }
    ], "Total time":"17.09 seconds"  }


Code Coverage
---------

Node side code coverage
==========

To tell Arrow you would like to create code coverage report simply type:

::

  arrow <some test or test descriptor> --coverage=true

By default all js file(and it's require files) parsed from cmd line : --lib or test descriptor: commonLib/lib will get instrumented and generate code coverage report after all tests done.
And two more optional params to use for coverage:
::
 --coverageExclude : (optional) string. comma-separated list of files to exclude from coverage reports"
 --keepIstanbulCoverageJson : (optional) true/false. if set to true, it does not delete Istanbul coverage json files. (default: false)

Client side code coverage
==========

If you want to collect client(browser) side code coverage(thus,some libs served on the test page),then you will use arrow proxy server.
In your test descriptor you can config like :

::

    {
        "settings": [ "master" ],
        "name": "client side test",
        "config": {
        },

        "startProxyServer": true,
        "routerProxyConfig": "./proxy_config.json",

        "dataprovider": {

            "iframe_client": {
                "group": "client",
                "params": {
                    "test": "test-client.js",
                    "page": "url/to/the/test/page"
                }
            }
        }
    }

Make sure you have set "startProxyServer" to true and add a config for proxy - proxy_config.json:

::

  {
     "router": {
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
         "coverageExclude": ["^http://yui.yahooapis.com.*\\.js$"],
         "timeout": 5000
     }
  }

In this proxy_config ,the "router" defines router table where you can modify the test page with new host and new headers for all calls being made by browser.Also supports recording of select url calls if set "record" to true.
In coverage field you can set "clientSideCoverage" to true and add a filter to ignore some js files in "coverageExclude".And if your page has multiple cross-domain frames and you can enlarge the timeout seconds waiting for coverage data
collecting.

Then in arrow cmd you can type:

::

    arrow test_descriptor.json --browser=chrome --logLevel=debug --coverage=true

You can see that all js file except those defined in "coverageExclude" will get instrumented and generate code coverage.


Client side code coverage NOTES:
==========

1. If you have multiple test(session) and multiple page run in one descriptor, then all libs coverage data in these pages(even if the lib are
loaded from different page but with same source url , like yui-min file) will be merged and generate one report.

::

             "news": {
                 "group": "client",
                 "params": {
                     "test": "testnews.js",
                     "page": "http://news.yahoo.com"
                 }
             },
             "finance": {
                 "group": "client",
                 "params": {
                     "test": "testfinance.js",
                      "page": "http://finance.yahoo.com"
                 }
             }

2. If you have one test (session) but with multiple pages, for example,you first launch yahoo news page then go to finance page, then only the libs on finance page will
get collected (because when switch to to another page,the previous page coverage data was lost).

::

            "multiple-page" : {
                 "params" :{
                     "scenario": [
                         {
                             "page": "http://news.yahoo.com"
                         },
                         {
                             "controller": "locator",
                             "params": {
                                 "value": "#mediasearchform-submit",
                                 "click": true
                             }
                         },
                         {
                             "page": "http://finance.yahoo.com"
                         },
                         {
                             "test": "test-title.js",
                             "title": "Yahoo! Finance - Business Finance, Stock Market, Quotes, News"
                         }
                     ]
                 }
             }

3.For some pages like yahoo login page, we can't proxy it in arrow proxy server due to some strict restriction policy. But you can add router to route to another mocked login page or
just add a filter to  "coverageExclude" in page level:

::

    "coverage": {
         "clientSideCoverage": true,
         "coverageExclude": ["^http://login.yahoo.com$"]
    }

Then login page won't be instrumented and collect coverage.

4.Https pages are not supported yet.

More YUI Asserts
----------------

Extended version of Assertions
------------------------------
------------------------------

::

    Y.Assert.isUrl - Is a valid URL
    Y.Assert.isMatch - Match string against supplied Regex
    Y.Assert.hasKey - Does Object have a specific key
    Y.Assert.hasValue - Does Object have a specific value
    Y.Assert.hasDeepKey - Validate key exists in a nested object
    Y.Assert.hasDeepValue - Validate value exists in a nested object
    Y.Assert.operator - Compare two values
    Y.Assert.isNode - Validate a Dom Node exists
    Y.Assert.nodeTextEquals - Validate text of a Dom node equals expected value
    Y.Assert.nodeTextExists - Validate Dom node has text in it
    Y.Assert.nodeCount - Validate selector counts(look at example below)
    Y.Assert.nodeContains - Validate if given needle is within the HTML of a module
    Y.Assert.isImage - Validate if Dom node is a valid image
    Y.Assert.isAnchor - Validate if Dom node is a valid anchor

How to use the above assertions?
--------------------------------
--------------------------------

Create a test which includes libraries ‘html-module-lib’ and ‘dom-lib’

Use test-assert-1.js as a test case where user checks for Y.Assert.isNode and Y.Assert.nodeCount

::

    YUI.add("MyAwesomeModule-tests", function (Y) {
    'use strict';

    var suite = new Y.Test.Suite("Assertion Tests 1");

    suite.add(new Y.Test.Module({

      "name" : "Assertion Test 1",
       "id": "yuhead-com-links",

      "asserts" : {
        "Logo Present" : {
          "locator" : ".yuhead-com-link-item",
          "type" : "isNode"
        },
            "Test Greater than" : {
          "locator" : ".yuhead-com-link-item",
          "type" : "nodeCount",
          "expected" : ">1",
          "message" : "There should be more than 1 list items with class yuhead-com-link-item"
        },
            "Test Less than" : {
          "locator" : ".yuhead-com-link-item",
          "type" : "nodeCount",
          "expected" : "<5",
          "message" : "There should be more than 5 list items with class yuhead-com-link-item"
        },
            "Test Equals" : {
          "locator" : ".yuhead-com-link-item",
          "type" : "nodeCount",
          "expected" : "=3",
          "message" : "There should be 3 list items with class yuhead-com-link-item"
        }

      }
    }));

    Y.Test.Runner.add(suite);

    }, "0.1", {requires : ["test", "node", "html-module-lib", "dom-lib"]});


Use test-descriptor-1.json as a descriptor to run above test

::

    [
      {
          "settings": [ "master" ],

          "name" : "tabview",

          "config" :{
              "baseUrl" : "http://finance.yahoo.com"
          },

          "dataprovider" : {

             "dom_int" : {
                  "params" : {
                      "test" : "test-assert-1.js",
                      "page" : "$$config.baseUrl$$"
                    },
                  "group" : "smoke"
              }

          }

      },

      {
          "settings": [ "environment:development" ]
      }

    ]

Run the test in usual way using,

::

    arrow test-descriptor-1.json --browser=chrome

Make sure it passes

Note: More such examples are provided in test-assert-2.js and test-descriptor-2.json
