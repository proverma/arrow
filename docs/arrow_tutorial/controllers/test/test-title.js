/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*
 * Like other tests, this is a YUI test module
 *
 */
YUI({ useBrowserConsole: true }).use("node", "test", function(Y) {

        //We initialize the suite object as a YUI test suite and with a suite title
    var suite = new Y.Test.Suite("Title test of the test");
    suite.add(new Y.Test.Case({

        //We are creating a simple test called "test title"
        "test title": function() {

            //In order to paramertize this, instead of having a static title, we call it from the config
            var title = this.testParams["title"];

            //If the title is null, set it to empty
            if(!title) title = "";
            Y.Assert.areEqual(title, document.title);
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
});

