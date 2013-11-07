==========================
Arrow Quick Installation
==========================

.. _Mac Installation:

**Mac Installation**

It is assumed that user has already installed Nodejs and Phantomjs. For installing them please refer `here <https://github.com/yahoo/arrow/blob/master/docs/arrow_cookbook/arrow_getting_started.rst#mac-installation>`_.

Here we are installing Arrow locally.

1.   This will create ./node_modules folder where you run the below command and will put yahoo-arrow inside.

::

    sudo npm install yahoo-arrow

2.   Make sure Arrow got installed properly.The command given below will show the Arrow version you have installed.

::

    ./node_modules/.bin/arrow --version

 3.   Create a simple unit test- test-unit.js

::

    YUI.add("unit-tests", function (Y) {
       //Create a basic test suite
       //We're calling it "unit test suite"
       var suite = new Y.Test.Suite("unit test suite");

       //Add a test case to the suite; "test greet"
       suite.add(new Y.Test.Case({
           "test addition": function() {

               //Our test will check for the math addition
               Y.Assert.areEqual(parseInt('2')+parseInt('5'), "7");
           }
       }));

       //Note we are not "running" the suite.
       //Arrow will take care of that. We simply need to "add" it to the runner
       Y.Test.Runner.add(suite);
    }, "0.1", {requires:["test"]});

 4.   Run the test

::

   ./node_modules/.bin/arrow test-unit.js

 5.   The output

::

Passed unit test suite onnodejs
1 Passed, 0 Failed , 0 skipped

.. _Linux Installation:

**Linux Installation**

It is assumed that user has already installed Nodejs, npm and Phantomjs. For installing them please refer `Here <https://github.com/yahoo/arrow/blob/master/docs/arrow_cookbook/arrow_getting_started.rst#linux-installation>`_.

Here we are installing arrow locally.

1.    This will create ./node_modules folder where you run the below command and will put yahoo-arrow inside.

::

    sudo ynpm install yahoo-arrow

2.    Configure Arrow to allow for custom controllers

::

   sudo ln -s /home/y/lib/node_modules/ /node_modules

3.    Make sure Arrow got installed properly.The command given below will show the Arrow version you have installed.
::

  ./node_modules/.bin/arrow --version

4.    Create a simple unit test- test-unit.js

::

   YUI.add("unit-tests", function (Y) {
      //Create a basic test suite
      //We're calling it "unit test suite"
      var suite = new Y.Test.Suite("unit test suite");

      //Add a test case to the suite; "test greet"
      suite.add(new Y.Test.Case({
         "test addition": function() {

             //Our test will check for the math addition
             Y.Assert.areEqual(parseInt('2')+parseInt('5'), "7");
         }
       }));

      //Note we are not "running" the suite.
      //Arrow will take care of that. We simply need to "add" it to the runner
      Y.Test.Runner.add(suite);
   }, "0.1", {requires:["test"]});

 5.   Run the test

::

  ./node_modules/.bin/arrow test-unit.js

 6.    The output

::

  Passed unit test suite onnodejs
  1 Passed, 0 Failed , 0 skipped

