/*
 * This the skeleton of a basic func test for a multi-tab module
 * It delegates actual testing to test-lib.js, which performs the actual assertions
 */
YUI.add("martini-test-func-tests", function (Y) {

    // Get the tab view
    var tabid = "#things";
    var tabNode = Y.one(document.body).one(tabid);

    //Get access to test-lib.js
    var tabTest = Y.Arrow.Test.TabView;

    //Create a test suite and name it "TabView unit test suite"
    var suite = new Y.Test.Suite("TabView functional test suite");
    
    /*
     * Add a new test, with three validations to the suite
     * We are going to use the "validateStructure" and "validateSelection" methods
     * in "media-test-tabview" for the actual validation. 
     * Note, the values we are passing are relevant to our "mock" page (testMock.html)
     */
    suite.add(new Y.Test.Case({
        "test tab structure": function() {
            tabTest.validateStructure(tabNode, ["#tab1", "#tab2", "#tab3"], ["#mod1", "#mod2", "#mod3"]);
        },
        "test tab selection": function() {
           tabTest.validateSelection(tabNode, "#tab2", "#mod2");
           tabTest.validateSelection(tabNode, "#tab1", "#mod1");
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test","arrow-test-tabview"]});

