YUI.add("MyAwesomeModule-tests", function (Y) {
  'use strict';

  var suite = new Y.Test.Suite("Assertion Tests 3");

  suite.add(new Y.Test.Module({

    "name" : "Assertion Test 3",
     "id": "ms-market-strip-0",

    "asserts" : {
      "Logo Present" : {
        "locator" : ".Carousel-Item",
        "type" : "isNode"
      },
	  "Test Greater than" : {
        "locator" : ".Carousel-Item",
        "type" : "nodeCount",
        "expected" : ">1",
        "message" : "There should be more than 1 list items with class yuhead-com-link-item"
      },
	  "Test Less than" : {
        "locator" : ".Carousel-Item",
        "type" : "nodeCount",
        "expected" : "<100",
        "message" : "There should be more than 5 list items with class yuhead-com-link-item"
      }

    }
  }));

  Y.Test.Runner.add(suite);

}, "0.1", {requires : ["test", "node", "html-module-lib", "dom-lib"]});