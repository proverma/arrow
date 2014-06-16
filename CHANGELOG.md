# Change Log

# 0.6.5

 * Fix for supporting context with datadriven descriptors and fixing shrinkwrap [PR](https://github.com/yahoo/arrow/pull/267)

# 0.6.4

 * Setting rejectUnauthorized to false for webservice controller [PR](https://github.com/yahoo/arrow/pull/266)
 * Setting express version to 3.x and Mocha to ~1.18.2 [PR](https://github.com/yahoo/arrow/pull/252)

# 0.6.3

 * Fix to avoid ECONNRESET issue with Nodejs 10 [PR](https://github.com/yahoo/arrow/pull/250)

# 0.6.2

 * Restarting phantomjs before retry, if it crashed while test execution [PR](https://github.com/yahoo/arrow/pull/243) [Issue](https://github.com/yahoo/arrow/issues/240)
 * Add additional checks for markup-test.js [PR](https://github.com/yahoo/arrow/pull/244)

# 0.6.1

 * Fix for exitCode not working for unit tests [PR](https://github.com/yahoo/arrow/pull/239)
 * Fixing condition for descriptorSharedParams [PR](https://github.com/yahoo/arrow/pull/238)

# 0.6.0

 * Adding support for data driven descriptors [PR](https://github.com/yahoo/arrow/pull/237) [Documentation](http://yahoo.github.io/arrow/arrow_FAQs.html#how-can-I-reuse-same-descriptor-with-different-sets-of-data)
 * Adding support for sharing parameters from descriptors [PR](https://github.com/yahoo/arrow/pull/237) [Documentation](http://yahoo.github.io/arrow/arrow_FAQs.html#how-can-I-share-params-from-my-descriptor)
 * Error handling for JSON parsing in webservice controller [PR](https://github.com/yahoo/arrow/pull/235)

# 0.5.3

 * Adding support for specifying comments in descriptor [PR](https://github.com/yahoo/arrow/pull/232)
 * Making nodejs tests honor logLevel [PR](https://github.com/yahoo/arrow/pull/232)
 * Fixed the issue - space after a comma in the 'commonLib' string in 'test-descriptor.json' causes a fail [Issue](https://github.com/yahoo/arrow/issues/206) [PR](https://github.com/yahoo/arrow/pull/233)

# 0.5.2

 * Using cdnjs link for yui [PR](https://github.com/yahoo/arrow/pull/228)
 * Adding support to pass capabilities as JSON object, merging default capabilities with user defined capabilities [PR](https://github.com/yahoo/arrow/pull/227)

# 0.5.1

 * Adding support for Android browser [PR](https://github.com/yahoo/arrow/pull/219)
 * Adding support to resize the browser window [PR](https://github.com/yahoo/arrow/pull/205)
 * Fixing the issue - Error: EMFILE, too many open files 'node/proxy.log  [Issue](https://github.com/yahoo/arrow/issues/217) [PR](https://github.com/yahoo/arrow/pull/218)

# 0.5.0

 * Adding feature to Import tests from other descriptors based test or group [ Details - https://github.com/yahoo/arrow/pull/200 ]
 * Adding support for webdriver key object and improved error messaging [ Details - https://github.com/yahoo/arrow/pull/201 ]

# 0.4.3

 * adding path method to return installed arrow directory [ Details - https://github.com/yahoo/arrow/pull/199 ]

# 0.4.2

 * Turn off socket connection limiting in http.request() [ Details - https://github.com/yahoo/arrow/pull/195 ]
 * Changing require path for executors [ Details - https://github.com/yahoo/arrow/pull/197 ]

# 0.4.1

 * Using cdnjs link for chai.js and protocol independent urls for mocha & expect
 * Adding support for SSL proxy and adding more error event listeners for better error handling
 * Setting nodejs back as default driver
 * Not maximizing browsers for mobile tests

# 0.4.0

 * Support for starting reusable browser session from Arrow command
 * Fix for Mocha test failures on on IE8.

# 0.3.3

 * Fixed appium and android driver compatibility
 * Removed raw github links, which were failing mocha tests on IE8.

# 0.3.2

  * Fix for Screenshot url

# 0.3.1

  * Added selenium-webdriver in npm-shrinkwrap

# 0.3.0

  * Upgrading to selenium-webdriver version 2.39
  * Fixes for reporting when running with multiple browsers

# 0.2.0

  * Adding support for showing screenshots url in report [ For details - http://yahoo.github.io/arrow/arrow_FAQs.html#how-can-I-see-screenshoturls-in-report-and-console ]

# 0.1.0

  * Fix for overriding configurations using local config file
  * Fix for report file not being generated when custom controller failed to load

# 0.0.90

  * set logging level to ERROR and hooked up log4js ( for tests requiring Arrow server )
  * Improved examples in documentation

# 0.0.89

  * Refactoring
  * Bug fix

# 0.0.88

  * Added support for mouse hover in locator controller [ For details - https://github.com/yahoo/arrow/blob/master/docs/arrow_cookbook/arrow_FAQs.rst#how-can-i-use-the-locator-controller-to-test-mouse-hover-functionality ]
  * Maximizing browser before running tests


# 0.0.87

  * Added support for reading response headers using proxy
  * Integrated support for markup validation using DebugCSS [ For details - https://github.com/yahoo/arrow/blob/master/docs/arrow_cookbook/arrow_markup_testing.rst ]


# 0.0.86
 
  * Fixed startup error message for PhantomJs
  * Reverted the yui defaultAppSeed url from https to http
  * Improved error management & messages

# 0.0.85

 * Better Error Handling

# 0.0.84

 * No more HTML logs during mocha test execution
 * locator controller could be used for just waiting for an element, without performing any UI action.
 * Fixed a locator controller bug, where passing "stay" param used to discard 'waitForElement(s)' params
 * Added testTimeOut as a descriptor level param, now users can override testTimeout for a test
 * Added hasTest as a descriptor level param, now if a scenario does not have any test, but all the scenario steps pass, ARROW will consider it as a pass test.
 * Fixed a bug where "enabled" property does not used to work properly if a boolean 'false' is passed
 * Improved bunch of error messages
