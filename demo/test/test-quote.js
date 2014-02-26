YUI.add("quote-tests", function(Y) {
    var suite = new Y.Test.Suite("Quote Page test of the test");
    suite.add(new Y.Test.Case({
        "test quote": function() {

            //In order to paramertize this, instead of having a static quote, we call it from the config
            var quote = this.testParams["quote"];
            Y.Assert.areEqual(quote, Y.one(".yfi_rt_quote_summary").one("h2").get('text'));
        }
    }));

    Y.Test.Runner.add(suite);
}, "0.1", {requires:["node","test"]});
