# Change Log

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
