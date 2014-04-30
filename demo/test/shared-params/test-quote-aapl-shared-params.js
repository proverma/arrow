YUI.add("appl-quote-tests", function(Y) {
    var suite = new Y.Test.Suite("Quote Page AAPL test");
    suite.add(new Y.Test.Case({
        "test aapl quote": function() {

            var quote = this.testParams.descriptorSharedParams["applequote"];
            Y.Assert.areEqual(quote, Y.one(".yfi_rt_quote_summary").one("h2").get('text'));

        }
    }));

    Y.Test.Runner.add(suite);
}, "0.1", {requires:["node","test"]});
