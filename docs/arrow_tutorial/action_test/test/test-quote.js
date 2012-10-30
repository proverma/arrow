/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI({ useBrowserConsole: true }).use("node", "test", function(Y) {
    var suite = new Y.Test.Suite("Quote Page test of the test");
    suite.add(new Y.Test.Case({
        "test quote": function() {
            Y.Assert.areEqual("Yahoo! Inc. (YHOO)", Y.one(".yfi_rt_quote_summary").one("h2").get('text'));
        }
    }));

    Y.Test.Runner.add(suite);
});

