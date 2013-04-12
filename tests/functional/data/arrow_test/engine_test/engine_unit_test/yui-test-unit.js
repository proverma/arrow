
YUI.add("media-greeter-tests", function (Y) {
    //Create a basic test suite
    //We're calling it "unit test suite"
    var suite = new Y.Test.Suite("unit test suite");
    
    //Add a test case to the suite; "test greet"
    suite.add(new Y.Test.Case({
        "test greet": function() {
            var greeter = new Y.Media.Greeter();
            
            //The method we are testing will inverse the firstname and lastname
            //Our test   will check for that inversion
            Y.Assert.areEqual(greeter.greet("Joe", "Smith"), "Smith, Joe");
        }
    }));

	//Add a test case to the suite; "test greet"
	suite.add(new Y.Test.Case({
		"test greet": function() {
			var greeter = new Y.Media.Greeter();

			//The method we are testing will inverse the firstname and lastname
			//Our test   will check for that inversion
			Y.Assert.areEqual(greeter.greet("areyou", "who"), "who, areyou");
		}
	}));

    //Note we are not "running" the suite. 
    //Arrow will take care of that. We simply need to "add" it to the runner
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test","media-greeter"]});
