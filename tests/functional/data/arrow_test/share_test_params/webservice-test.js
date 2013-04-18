/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("webservice-controller-tests", function (Y) {

    var suite = new Y.Test.Suite("Test result from webservice controller");
    suite.add(new Y.Test.Case({

        "webservice controller result": function() {

            // get test params share variable 
            var shared = this.testParams["shared"];

            Y.Assert.areEqual(shared.statusCode, 200); 
            Y.Assert.isNotNull(shared.data); 
            Y.Assert.areEqual(shared.data.query.count, 1); 

            // You can add more asserts here
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test"]});

