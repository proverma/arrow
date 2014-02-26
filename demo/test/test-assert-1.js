YUI.add("MyAwesomeModule-tests", function (Y) {
  'use strict';

  var suite = new Y.Test.Suite("Assertion Tests 1");

  suite.add(new Y.Test.Module({

    "name" : "Assertion Test 1",
     "id": "yuhead-com-links",

    "asserts" : {
      "Logo Present" : {
        "locator" : ".yuhead-com-link-item",
        "type" : "isNode"
      },
	  "Test Greater than" : {
        "locator" : ".yuhead-com-link-item",
        "type" : "nodeCount",
        "expected" : ">1",
        "message" : "There should be more than 1 list items with class yuhead-com-link-item"
      },
	  "Test Less than" : {
        "locator" : ".yuhead-com-link-item",
        "type" : "nodeCount",
        "expected" : "<5",
        "message" : "There should be more than 5 list items with class yuhead-com-link-item"
      },
	  "Test Equals" : {
        "locator" : ".yuhead-com-link-item",
        "type" : "nodeCount",
        "expected" : "=3",
        "message" : "There should be 3 list items with class yuhead-com-link-item"
      }

    }
  }));

  Y.Test.Runner.add(suite);

}, "0.1", {requires : ["test", "node", "html-module-lib", "dom-lib"]});