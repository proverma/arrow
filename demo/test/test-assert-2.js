YUI.add("MyAwesomeModule-tests", function (Y) {
  'use strict';

  var suite = new Y.Test.Suite("MyAwesomeModule Tests");

  suite.add(new Y.Test.Module({

    "name" : "MyAwesomeModule",
     "id": "mediabcarouselmixedhcm",

    "asserts" : {
	
	 "Test Anchor" : {
	        "locator" : ".item-wrap a",
	        "type" : "isAnchor"
	      },
	
	      "Test Image" : {
	        "locator" : ".item-wrap a img",
	        "type" : "isImage"
	      },
		
		"Test Node Contains" : {
		        "locator" : ".heading h3",
		        "type" : "nodeContains",
		        "expected" : "Today on Yahoo!"
		 },
		
		 "Test Node Text Exists" : {
		        "locator" : ".heading h3",
		        "type" : "nodeTextExists"
		 }
	

    }
  }));

  Y.Test.Runner.add(suite);

}, "0.1", {requires : ["test", "node", "html-module-lib", "dom-lib"]});