================================
Arrow and Continuous Integration
================================

Arrow has always had Continuous Integration in mind. Arrow provides you with all of the necessary tools to run in a CI System.

Dealing With Different Environments or Hosts
--------------------------------------------

In all CI systems, you must deal with varying hosts as your code moves through its validation cycle. For example, as you are developing, the host of the application will likely be *localhost* or perhaps a development machine. Once you commit your code it may go to an *integration* environment where the host will likely be different. Yet as that code moves to your *staging* or even *production* environment, your host will change once more.

You can manage this using `test descriptors <./arrow_in-depth.rst#test-suite-organization>`_ and `dimensions files </arrow_in-depth.rst#test-descriptor-parametrization-and-test-environments>`_

You can also manage this by using the **--baseUrl** parameter in your command:

::

  arrow <some test or test descriptor> --baseUrl=http://some.base.url.com

Arrow will override any *baseUrl* value either in the *config* file or it the *test descriptor* and will use it instead.

Reporting
---------

As `described before </arrow_in-depth.html#reporting>`_, Arrow supports two types of reports. If you use multiple *test descriptors* for your execution, Arrow will *merge* the results and report all results in one report (of each type).

To enable reporting simply include the **--report=true** parameter in your command

::

  arrow <some test or test descriptor> --report=true