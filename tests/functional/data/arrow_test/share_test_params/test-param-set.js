/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("test-params-set-tests", function (Y) {

    var suite = new Y.Test.Suite("Test params setting test");
    suite.add(new Y.Test.Case({

        "test set test params": function() {

            // set test params shared
            this.testParams.shared = {"name": "value"};

            Y.Assert.areEqual(this.testParams.shared.name, "value");
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test"]});

