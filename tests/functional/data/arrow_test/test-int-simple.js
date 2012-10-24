/*
 * Like test_int.js, this is just another test as far as arrow is concerned
 * The difference here is the expected values of test.
 * The only difference here is it does npt depend on test-lib.js and does assertions
 * here itself.
 */
YUI.add("test-int-tests", function (Y) {

    // render tab view
    var tabid = "#things";
    var tabNode = Y.one(document.body).one(tabid);

    //Get access to test-lib.js
    var testLib = Y.Arrow.Test.TabView;

    //Create a test suite and name it "TabView unit test suite"
    var suite = new Y.Test.Suite("TabView Integration test suite");

    /*
     * Add a new test, with one validation to the suite
     * We are going to use the "validatePresence" method to check for specific values
     * Note, the values we are passing are relevant to our "integration" page (tabview.html)
     */
    suite.add(new Y.Test.Case({
        "test tab presence": function() {
            Y.Assert.isNotNull(tabNode,"The tabNode is not present");
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test","arrow-test-tabview"]});

