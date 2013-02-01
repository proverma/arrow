==============================
Extending and Developing Arrow
==============================

Extending Controllers
---------------------

Controllers are a very important part of Arrow. As described in the `architecture, <./arrow_intro.rst#arrow-internals>`_ *controllers* are a way to *control* when and where your test will execute. By default, **Arrow** assumes you want to execute your test against the *page* or *HTTP endpoint* given in the **--page=** parameter.

Additionally, Arrow provides the concept of `complex scenarios, <./arrow_in-depth.rst#complex-test-scenarios>`_ you can create a *scenario* using a combination of the *default* and the `locator controller. <./arrow_in-depth.rst#the-locator-controller>`_

However, there may still be the case where Arrow's built-in controllers are not sufficient for your needs. In this case, a user can create their own **custom controllers** to satisfy their needs.

All controllers, including *default* and *locator* extend from the same **controller** interface. The **controller** interface provides you the following methods:

* setup
* execute
* tearDown

How To Create A Custom Controller
=================================

Let's take the example we described in the `complex scenarios <./arrow_in-depth.rst#complex-test-scenarios>`_ section. In that case we wanted to go to finance.yahoo.com, enter a ticker value and make sure we got to the correct page. We can convert those steps to into a *custom controller*

First you need to make sure you can *create* a custom controller by executing this command:

::

   sudo ln -s /usr/local/lib /node_modules

Now you can begin. Here is a sample implementation of what such a *custom controller* could look like:

::

  var util = require("util");
  var log4js = require("arrow").log4js;
  var Controller = require("arrow").controller;

  function FinanceCustomController(testConfig,args,driver) {
      Controller.call(this, testConfig,args,driver);

      this.logger = log4js.getLogger("FinanceCustomController");
  }

  /*
   * All controllers MUST implement the Controller interface
   */
  util.inherits(FinanceCustomController, Controller);


  /**
   * In the execute method you get full access to webdriver's methods
   * Additionally, you can get a handle to the parameters in your descriptor
   * file by using this.testParams
   *
   * Lastly, in this case, the last statement is to execute the test
   * You'll note executeTest includes the same parameters as Arrow's CLI
   */
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
          webdriver.get(page).then(function() {
              self.logger.info(self.config);

              //Navigate the page as necessary
              webdriver.findElement(webdriver.By.css(txtLocator)).sendKeys(typeText);
              webdriver.findElement(webdriver.By.css(btnLocator)).click();
              self.testParams.page=null;
              webdriver.getTitle().then(function(title) {

                  //Execute the test
                  self.driver.executeTest(self.testConfig, self.testParams, function(error, report) {
                      callback();
                  });
              });
          });
      }else{
          this.logger.fatal("Custom Controllers are currently only supported on Selenium Browsers");
      }
  }

  module.exports = FinanceCustomController;

Now let's take a look at what the *Test Descriptor* would look like.

::

  [
      {
          "settings": [ "master" ],

          "name": "controllers",

          "config": {
              "baseUrl": "http://finance.yahoo.com"
          },

          "dataprovider" : {

              "Test YHOO Ticker using Finance Controller" : {
                  "group" : "func",
                  "params" :{
                      "scenario": [
                          {
                              "controller": "finance-controller.js",
                              "params": {
                                  "page" : "$$config.baseUrl$$",
                                  "txtLocator": "#txtQuotes",
                                  "typeText": "yhoo",
                                  "btnLocator": "#btnQuotes",
                                  "test": "test-quote.js",
                                  "quote": "Yahoo! Inc. (YHOO)"
                              }
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

The *Test Descriptor* includes all of the information the controller will need; all under the **params** node

How To Execute
..............

Execution is **exactly the same** as in previous examples

::

  arrow <name of the test descriptor> --driver=selenium

Developing Arrow
----------------

Though the Arrow team members tried their best to think of all possible situations, there may be features which you feel would be good, or perhaps you want to contribute with bug patches.

How To Get Started
==================

Obviously, the first step will be to `download the source code <https://github.com/yahoo/arrow>`_

Once you have become familiar with Arrow, you'll probably want to make small changes to see them reflected locally.

To force NodeJS to look at your local instance of Arrow do the following:

1. Navigate to the location where Arrow's source code resides
2. Look for a file called package.json, it will be under: path_to_arrow_source/arrow/package.json)
3. From within the *arrow* folder, link your local instance of arrow to node by typing:

::

  sudo npm link

You can confirm if the *link* was successful by changing Arrow version in package.json ( under arrow/) to 0.0.0

::

    "version": "0.0.0",

 Doing arrow --version, you should get:

::

    0.0.0

How To Submit a Patch
=====================

Submit a pull request to https://github.com/yahoo/arrow when you want to submit your code. Your changes will merge with the master branch after review.


.. TODO... needs to be updated

Code Review Process
...................

.. TODO... needs to be updated

**DO NOT COMMIT your code without following the patch submission process**

How to Run Unit/Functional Tests?
.................................

.. TODO... needs to be updated

Get the `unit tests _

Navigate to the unit tests /arrow_tutorial/unit_test/test

Run the following command and make sure it passes

::

    arrow test-unit.js --lib=../src/greeter.js



**WIP**

.. TODO... needs to be updated


Get the `functional tests 
Navigate to the functional tests /arrow_tutorial/func_test/test

Run following command and make sure it passes

::

    npm test






