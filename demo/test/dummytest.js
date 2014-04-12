YUI.add("datadriven-tests", function(Y) {

    var suite = new Y.Test.Suite("Data driven test");

    suite.add(new Y.Test.Case({

        "test data driven": function() {

            Y.Assert.isTrue(true);

        }
    }));

    Y.Test.Runner.add(suite);
}, "0.1", {requires:["node","test"]});
