==========================
Getting Started With Arrow
==========================

.. _Installation:

**Installation**

Arrow is fully supported on:

   * Mac_
   * Linux_

We are working on providing support for Windows.

Installation consists of three main steps, *PhantomJS* installation, *Arrow* installation, Setting up Arrow and starting *Arrow Server*

.. _Mac:

Mac Installation
----------------

These instructions assume you do not have NPM and NodeJS installed. If you do, skip step 1

1. Install NodeJS and NPM:

 * Go to `Download <http://nodejs.org/#download>`_.
 * Follow the installation instructions

2. Due to a bug in PhantomJS v1.5, Arrow's webdriver implementation expects PhantomJS v1.6 or higher. If you are using a version lower than 1.6 please update it. To install/update, please navigate to: http://phantomjs.org/ and follow the instructions.

3. Copy the phantomjs binary to

::

   /usr/local/bin

4. Make the phantomjs binary executable

::

  chmod +x phantomjs

5. Install Arrow Package **globally** through NPM:

::

   sudo npm install yahoo-arrow -g


5. To **locally** install Arrow use following

::

   sudo npm install yahoo-arrow

6. Configure Arrow to allow for custom controllers (This step is only needed when you are installing arrow globally)

::

   sudo ln -s /usr/local/lib /node_modules

7. Start Arrow Server on the command prompt (note, this must be left **ON** or the process will die)

::

   arrow_server

7. Local installation of yahoo-arrow will put arrow under ./node_modules/.bin and to run arrow from there use

::

    ./node_modules/.bin/arrow --version
    ./node_modules/.bin/arrow_server
    ./node_modules/.bin/arrow test_descriptor.json

Now you may proceed to Install Verification_.

.. _Linux:

Linux Installation
------------------

.. todo we need to rework the installation for Linux

**Note:** Though the dist package say it only supports RHEL 4.x, we have found ``ynodejs06`` works for
RHEL 5.x (5.0-20070208, 5.2-20080429, 5.4-20090902, 5.6-20110328) as well.


1. Install NodeJS06, PhantomJS and NMP:

::

TODO... needs to be updated



2. Set yinst options as follows:

::

TODO... needs to be updated



3. Install Arrow:

::

TODO... needs to be updated


4. Configure Arrow to allow for custom controllers

::

TODO... needs to be updated


5. Start Arrow Server on the command prompt (note, this must be left **ON** or the process will die)

::

   arrow_server

Now you may proceed to Install Verification_.


Selenium Server
---------------

Arrow uses `Selenium Server <http://seleniumhq.org/>`_ to excute all browser-related tests. Selenium should run on a machine which has access to the browsers you want to use. Normally Selenium Server will run on Mac or Windows Machine.

Start Selenium
==============

To start Selenium Server you simply need to do the following:

1. `Download <http://selenium.googlecode.com/files/selenium-server-standalone-2.25.0.jar>`_ the Selenium JAR Executable
2. To **Run** the Selenium executable type this:

::

  java -jar path/to/selenium-server.jar

Note Selenium Server is **NOT** required for Arrow to work. However, it is strongly recommended.

To start Selenium Server using chromedriver and default Firefox profile use

::

    java -Dwebdriver.chrome.driver=./chromedriver -Dwebdriver.firefox.profile=default -jar selenium-server-standalone-2.xx.0.jar


.. _Verification:

Verifying the Installation
--------------------------

Make sure you are able to execute ALL the commands below:


Check Arrow Help
================

::

  arrow --help

::

    OPTIONS :
     --lib : a comma seperated list of js files needed by the test
     --page : (optional) path to the mock or production html page
                example: http://www.yahoo.com or mock.html
     --driver : (optional) one of selenium|browser. (default: selenium)
     --browser : (optional) a comma seperated list of browser names, optionally with a hypenated version number.
                   Example : 'firefox-12.0,chrome-10.0' or 'firefox,chrome' or 'firefox'. (default: firefox)
     --controller : (optional) a custom controller javascript file
     --reuseSession : (optional) true/false. Determines whether selenium tests reuse existing sessions. (default: false)
                        Visit http://<your_selenuim_host>/wd/hub to setup sessions.
     --parallel : (optional) test thread count. Determines how many tests to run in parallel for current session. (default: 1)
                       Example : --parallel=3 , will run three tests in parallel
     --report : (optional) true/false.  creates report files in junit and json format. (default: true)
                  also prints a consolidated test report summary on console.
     --reportFolder : (optional) folderPath.  creates report files in that folder. (default: descriptor folder path)
     --testName : (optional) comma seprated list of test name(s) defined in test descriptor
                    all other tests will be ignored.
     --group : (optional) comma seprated list of group(s) defined in test descriptor.
                 all other groups will be ignored.
     --logLevel : (optional) one of DEBUG|INFO|WARN|ERROR|FATAL. (default: INFO)
     --dimensions : (optional) a custom dimension file for defining ycb contexts
     --context : (optional) name of ycb context
     --seleniumHost : (optional) override selenium host url (example: --seleniumHost=http://host.com:port/wd/hub)
     --capabilities : (optional) the name of a json file containing webdriver capabilities required by your project

    EXAMPLES :
     Unit test:
       arrow test-unit.js --lib=../src/greeter.js
     Unit test with a mock page:
       arrow test-unit.js --page=testMock.html --lib=./test-lib.js
     Unit test with selenium:
       arrow test-unit.js --page=testMock.html --lib=./test-lib.js --driver=selenium
     Integration test:
       arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js
     Integration test:
       arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js --driver=selenium
     Custom controller:
       arrow --controller=custom-controller.js --driver=selenium

Check Arrow version
===================

::

  arrow --version

::

 [2012-05-17 12:12:06.665] [INFO] console - vX.X.X
 
Confirm you can run the Arrow server
====================================

::

  arrow_server

::

  l2tp-8-16:test ivan$ arrow_server
  [2012-05-17 12:08:31.322] [INFO] console - Server running at: http://Ivans-MacBook-Air.local:4459
  [2012-05-17 12:08:32.105] [INFO] console - GhostDriver Running At : http://Ivans-MacBook-Air.local:4460


Confirm Selenium is Running
===========================

Though Selenium Server is NOT required, if you chose to run it, you can confirm it's running successfully like this:

1. From a Browser, go to: http://host.or.url:port/wd/hub or http://localhost:4444/wd/hub
2. You should be directed to a WebDriver page


.. _Creating a test:

Creating a test
---------------

You are now ready to create and execute your first test. For our first test we are going to validate a simple YUI Module. This YUI module has one method called *greet*. *greet* take a first and last name and inverts them as its output

1. Create a folder called **arrow_test**

2. Inside arrow_test, create a folder called **src** (this will be our code source folder)

3. Create a file called **greeter.js** inside src and paste the code below into it

::

    YUI.add("arrow-greeter", function (Y) {
        Y.namespace("Arrow");

        var Greeter = Y.Arrow.Greeter = function() {};

        //This is a simple method which takes two params, first and last name
        //It returns it as lastname, firstname
        Greeter.prototype.greet = function(firstName, lastName) {
            return lastName + ", " + firstName;
        }
    }, "0.1", {requires:[]});

4. Inside arrow_test create a folder called **tests**

5. Create a file called **test-greeter.js** inside tests and past the code below into it

::

    YUI({ useBrowserConsole: true }).use("arrow-greeter", "test", function(Y) {
        //Create a basic test suite
        //We're calling it "Our First Test"
        var suite = new Y.Test.Suite("Our First Test");

        //Add a test case to the suite; "test greet"
        suite.add(new Y.Test.Case({
            "test greet": function() {
                var greeter = new Y.Arrow.Greeter();

                //The method we are testing will inverse the firstname and lastname
                //Our test will check for that inversion
                Y.Assert.areEqual(greeter.greet("Joe", "Smith"), "Smith, Joe");
            }
        }));

        //Note we are not "running" the suite.
        //Arrow will take care of that. We simply need to "add" it to the runner
        Y.Test.Runner.add(suite);
    });

Now we are ready to run our test.

6. Navigate to

::

    ~/arrow_test/tests

7. Type this to execute your test

::

    arrow test-greeter.js --lib=../src/greeter.js --driver=nodejs

Congratulations, you've successfully installed Arrow and created your first test



