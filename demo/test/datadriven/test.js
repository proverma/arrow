YUI.add("assrt-tests", function(Y) {
    var suite = new Y.Test.Suite("Assert Page test of the test");
    suite.add(new Y.Test.Case({
        "test assert": function() {

            Y.Assert.areEqual("1", "1");
        }
    }));

    Y.Test.Runner.add(suite);
}, "0.1", {requires:["node","test"]});
