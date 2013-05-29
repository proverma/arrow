/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("test-params-tests", function (Y) {

    var suite = new Y.Test.Suite("Test params setting and getting test");
    suite.add(new Y.Test.Case({

        "test set and get test params": function() {

            Y.Assert.isNotNull(this.testParams.shared.suggestion);
            Y.Assert.isNotNull(this.testParams.shared.searched);
            Y.Assert.areEqual(this.testParams.shared.suggestion, this.testParams.shared.searched);
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test"]});

