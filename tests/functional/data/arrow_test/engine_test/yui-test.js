/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("test-title-tests", function (Y) {

    //We initialize the suite object as a YUI test suite and with a suite title
    var suite = new Y.Test.Suite("YUI title test");
    suite.add(new Y.Test.Case({

        //We are creating a simple test called "test title"
        "test title": function() {

            //In order to paramertize this, instead of having a static title, we call it from the config
			var title = "Yahoo! Search - Web Search";
            //If the title is null, set it to empty
            if(!title) title = "";
            Y.Assert.areEqual(title, document.title);
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test","node"]});

