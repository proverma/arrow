YUI.add("datadriven-tests", function(Y) {
    'use strict';
    var suite = new Y.Test.Suite("Data driven test");

    suite.add(new Y.Test.Case({

        "test search button": function() {
            var node = Y.one(this.testParams.searchBtnId);
            Y.Assert.isNotNull(node, "Search button not found");

        }
    }));

    Y.Test.Runner.add(suite);
}, "0.1", {requires:["node","test"]});
