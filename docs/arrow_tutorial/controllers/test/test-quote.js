/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI({ useBrowserConsole: true }).use("node", "test", function(Y) {
    var suite = new Y.Test.Suite("Quote Page test of the test");
    suite.add(new Y.Test.Case({
        "test quote": function() {

            //In order to paramertize this, instead of having a static quote, we call it from the config
            var quote = this.testParams["quote"];
            Y.Assert.areEqual(quote, Y.one(".yfi_rt_quote_summary").one("h2").get('text'));
        }
    }));

    Y.Test.Runner.add(suite);
});

