YUI.add("quote-tests", function(Y) {
    var suite = new Y.Test.Suite("Quote Page YHOO test");
    suite.add(new Y.Test.Case({
        "test quote": function() {

            var quote = this.testParams.descriptorSharedParams["yhooquote"];
            Y.Assert.areEqual(quote, Y.one(".yfi_rt_quote_summary").one("h2").get('text'));

        }
    }));

    Y.Test.Runner.add(suite);
}, "0.1", {requires:["node","test"]});
