/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("test-params-get-tests", function (Y) {

    var suite = new Y.Test.Suite("Test params getting test");
    suite.add(new Y.Test.Case({

        "test title": function() {

            // get test params share variable 
            var shared = this.testParams.shared;

            Y.Assert.areEqual(shared.name, "value");
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test"]});

