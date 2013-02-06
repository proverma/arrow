/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("test-array-tests", function (Y) {

    //We initialize the suite object as a YUI test suite and with a suite title
    var suite = new Y.Test.Suite("Test for record:true");
    suite.add(new Y.Test.Case({

        //We are creating a simple test called "test title"
        "test array content": function() {
            var record = this.testParams["proxyManagerRecord"];
            Y.Assert.isNotNull(record,"The value of proxyManagerrecord array is null");

        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test","node"]});

