# Change Log

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