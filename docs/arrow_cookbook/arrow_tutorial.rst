==============
Arrow Tutorial
==============
This chapter will walk through the various types of tests for which Arrow is *normally* used; tests such as Unit_, Functional_ and Integration_.

Prerequisites
==================
You must have:


TODO... needs to be updated

* `Installed `_ the Arrow framework.
* `Downloaded `_ Arrow Tutorial from GitHub

.. _Unit:

Unit Tests
===========

The Demo includes a *unit_test* folder and includes two files:

TODO... needs to be updated


+---------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------+
| `unit_test/src/greeter.js `_       | Simple YUI module that takes two parameters as input, inverses their order, and returns them as output |
+---------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------+
| `unit_test/test/test-unit.js >`_ |	Unit test to validate the function.                                                                    |
+---------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------+

In the world of JS, unit tests validate JS functions/classes which do not interact with the DOM. Functionality which interacts with the DOM is usually considered to be functional and should be tested as such.

Executing the Unit Test
-----------------------

To execute the unit test example do the following:

1. Start arrow_server (leave that prompt open): ``arrow_server``

2. On a separate command prompt navigate to: ``~/arrow_tutorial/unit_test/test``

3. NodeJS is the default driver for JS unit tests and does not require any configuration. To run against NodeJS, type:

::

 arrow test-unit.js --lib=../src/greeter.js

*where*: ``--lib=`` Specifies the location of the source code to test.


To run against PhantomJS or a Selenium-supported browser, enter:

::

  arrow test-unit.js --lib=../src/greeter.js --driver=selenium --browser=phantomjs

  arrow test-unit.js --lib=../src/greeter.js --driver=selenium --browser=firefox

.. TODO... needs to be updated


**Note:** `Arrow Server <./arrow_getting_started.rst>`_ and `Selenium <./arrow_getting_started.rst#start-selenium>`_ need to be running

When you execute using PhantomJS, a screenshot is captured automatically. The screenshot is stored in the location where you executed the test (in this case, ``unit_test/test/``).

.. _Functional:

Functional Tests
================

src
---

Functional testing is a broad definition for anything that is *not* a unit test. This *may* include tests such as JS UI functional tests, and integration tests.

As in the *unit_test* demo, under *arrow_tutorial* there is a folder called *func_tests* For the purposes of this demo, we will be working with YUI "multi-tab" module. Furthermore, during this stage of testing, functional, we'll use a *mock* page to mock our ultimate application.

.. TODO... needs to be updated


+------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| `func_tests/src/tabview.js `_         | Our final application will make use of this file. This small piece of code will allow users to interact with application via tabs                                           |
+------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| `func_tests/test/testMock.html `_ | This is a very simple HTML which acts as our *mock* page container. It has the basic skeleton of the final output and references the JS code the final output will also use |
+------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

..  Our mock page looks like this:
..
..   image commented out - @dmitris image  starting.png
..
.. The final output of the application **will** look like this:
..
..  image commented out - @dmitris image final.png

test
----

.. TODO... needs to be updated


There are are number of test files in our *test* folder

+---------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| `func_tests/test/test-lib.js `_                    | This file acts as our test library. It is a YUI module whose purpose is to execute the various assertion and to facilitate code-sharing across other test files                                                       |
+---------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| `func_tests/test/test-func.js `_                  | This is the skeleton of a basic functional test. In conjunction with test-lib.js, it makes tests easier to read by turning each statement into an action (validateSelection, validateStructure, etc                   |
+---------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| `func_tests/test/test-int.js `_                    | Similar to test-func.js, test-int.js performs functional tests, however, it makes assertions about the values of each tab. test-func and test-int can be used together to validate the integration of our application |
+---------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| `func_tests/test/test-descriptor.json `_  | A *test descriptor* file is a way in Arrow to organize a test suite. Rather than having a long list of arrow commands, you can group your tests in a *test descriptor* and build test suites out of them              |
+---------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

For now, let's look deeper at the test-func.js file. The tests within are pretty simple, they test:

* The tabs are present.
* You can select on different tabs.

Executing the Functional Test
-----------------------------

To execute the func tests do the following:

1. Start arrow_server (leave that prompt open): ``arrow_server``

2. On a separate command prompt navigate to. ``~/arrow_tutorial/func_test/test``

3. Because these tests require a web page, Arrow defaults the driver to FireFox (**Note** `Selenium Server <./arrow_getting_started.rst#start-selenium>`_ must be running), type:

::

  arrow test-func.js  --page=testMock.html --lib=test-lib.js

*where:* ``--page=..`` tells Arrow where the *mock* page resides

To run against PhantomJS, enter:

 ::

  arrow test-func.js  --page=testMock.html --lib=test-lib.js  --browser=phantomjs

**Note** if the *--browser* parameter is used, Arrow will direct traffic to your instance of *Selenium Server* or *arrow_server*

You do not need to provide the full URL to the mock page; Arrow takes care of that for you. 

**Note** in the commands above, we ``included`` our *test library* file as input in the ``--lib=`` param. We did this in order to satisfy test-func.js's dependency on this file.

.. _Integration:

Integration Tests
=================

In Arrow, the difference between a JavaScript UI functional test and a JavaScript UI integration test is minor. From Arrow's perspective, *integration* tests *can* be functional tests executed against an HTTP End-Point. An HTTP End-Point can be an integration, staging or production environment.

In other words, if your JavaScript UI *functional_* test is constructed smartly, you could use it for *integration* testing as well.

.. TODO... needs to be updated

Consider the `test-int.js `_ file. It confirms the tabs have specific values. For this simple app, those values *would* come from a WS or some type of integration with another system.

Executing the Integration Test
------------------------------

For this example, we'll suppose our AUT is hosted elsewhere (perhaps in an integration, testing, or staging environment); http://www.doctor46.com/tabview.html

Execution of the tests follows a familar theme:

1. Because the AUT is hosted elsewhere, we don't need arrow_server, simply navigate to: ``~/arrow_tutorial/func_test/test``

2. To execute type:

::

  arrow test-int.js  --page=http://www.doctor46.com/tabview.html --lib=test-lib.js

**Note** the --page parameter is now pointing to an HTTP End-Point rather than our mock page

**Note:** To run against PhantomJS, enter:

::

  arrow test-int.js  --page=http://www.doctor46.com/tabview.html --lib=test-lib.js --browser=phantomjs

Similarly, you can run func tests (test-func.js) against the HTTP End-Point like this:

::

  arrow test-func.js  --page=http://www.doctor46.com/tabview.html --lib=test-lib.js

Conclusion
==========

As you can see, Arrow allows you to execute all types of tests (unit, functional and integration) using the same methodology. Unlike other frameworks, it does not dictate to you how to execute different tests, as far as Arrow is concerned, tests are just tests.