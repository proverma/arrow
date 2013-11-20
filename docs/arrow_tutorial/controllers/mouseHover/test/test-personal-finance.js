YUI.add("finance-topnav-pf-tests", function(Y) {

	/* Create a test suite and name it. */
	var suite = new Y.Test.Suite("Smoke-Finance TopNav Menu Item Personal Finance Tests");

    suite.add(new Y.Test.Case
	(
		{
       		"#1 - Test menu option is present": function()
        	{
        		var menu = this.testParams.menu,
        			/* Locate for elements on the page using css selector. */
        			firstMenuItemCSS = Y.one("#y-main-nav li:nth-child(6) li:nth-child(1)");
                Y.Assert.isNotNull(firstMenuItemCSS);
                Y.Assert.areSame(menu[0], firstMenuItemCSS.get("text"));
        	}
 		}
	)
	);

    Y.Test.Runner.add(suite);
}, "0.1", { requires:["test","node"]});
