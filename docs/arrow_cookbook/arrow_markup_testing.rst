===============================
Debugging General Markup Errors
===============================

`DebugCSS <http://yahoo.github.io/debugCSS/>`_ rules may be run via Arrow under the name markup-test. As most markup-test rules are simply suggestions, it will only have assertions for the most egregious errors. To make full use of markup-test, ensure you execute it with logLevel=debug to expose all areas of concern.

**What Does It Check?**

Markup is tested against many validation errors, but to give a brief sampling:

	* IMG tag without a valid SRC attribute._
	* Class attritubes on any node that are seemingly invalid or non-semantic._
	* A number of validation checks against TABLE elements and associated children._
	* Inline styles, inline Javascript._
	* Deprecated tags._
	* Improperly nesting of some elements (anchor within another anchor - non-LI immediate child element to a UL or OL, etc)._

To see a full a full list and test suite of rules being checked, visit the `DebugCSS <http://yahoo.github.io/debugCSS/>`_ page.

**Setup**

It is assumed that user has already installed Arrow instance and all requisite software (Node.js and Phantomjs). If you do not have Arrow currently installed, refer to the `Getting Started With Arrow <https://github.com/yahoo/arrow/blob/master/docs/arrow_cookbook/arrow_getting_started.rst>`_ documentation.

Once Arrow is installed and working properly, we can make a test against any accessible page:

1.   Reference the `markup-descriptor.json <https://github.com/yahoo/arrow/blob/master/demo/test/markup-descriptor.json>`_ which looks like this:

::

	[
	    {
	        "settings": [ "master" ],

	        "name" : "markup-test",

	        "dataprovider" : {
	              "Generic Markup Test" : {
	                  "group" : "smoke",
	                  "params" : {
	                      "test" : "../../lib/common/tests/markup-test.js",
	                      "page" : "http://yahoo.com",
	                      "warnOnly" : false
	                  }
	              }
	          }
	      }
	]

 2.   Make sure your "test" element points to the correct test file. By default, it will live in `arrow/lib/common/tests/markup-test.js <https://github.com/yahoo/arrow/blob/master/lib/common/tests/markup-test.js`_

 3.   Populate the "page" element with the website you'd like to run the markup test against.  You can have the markup test only throw warnings to console - or trigger it to cause assertion failures.

 4.   Make sure phantomjs is running in another terminal:

::

	phantomjs --webdriver=4445

 5.   Execute your markup descriptor file created in steps 1 - 3 (the --logLevel=debug is important here to get all warnings):

::

	arrow markup-descriptor.json --browser=phantomjs --logLevel=debug

 5.   Your test output should look something like this.  It should be color coded (gray is not a big deal, red is more of a concern):

::

	[LOG] =========================================================================
	[LOG] Visit http://yahoo.github.com/debugCSS/ for help debugging these problems
	[LOG] * Table without summary.
	[LOG] * tbody as first-child of table (instead of tfoot or thead).
	[LOG] * Legacy style attribute found on table.
	[LOG] * Legacy style attribute found on element.
	[LOG] * Empty element - is it necessary?
	[LOG] * Img tag missing alt text.
	[LOG] * Anchor tag with no javascript fall-back link.
	[LOG] * Anchor tag with inline javascript.  Tsk tsk.
	[LOG] * Labels should probably specify the for attribute instead of relying on siblings.
	[LOG] * Block level element within span level element.
	[LOG] * Form without a fieldset.
	[LOG] * Use of b or i tags can be bad.  Do you know what you're doing?
	[LOG] * Some pretty non-semantic / legacy tags being used here.
	[LOG] * Classname appears potentially non-semantic.
	[LOG] =========================================================================

 6.   The above error is handy in seeing that you have problems. It's suggested to use the companion `DebugCSS Bookmarklet <http://yahoo.github.io/debugCSS/>`_.  This will point out exactly where in your page the errors have been found - and give suggestions on how to fix them.

