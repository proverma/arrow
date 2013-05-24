YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'test', 'console', function (Y) {
    "use strict";
    var suite = new Y.Test.Suite("Common: bbcnews");
    suite.add(new Y.Test.Case({

        "test bbcnews": function () {
            var boxes = Y.all('ul.main-sv li');
            Y.Assert.areSame(10, boxes.size());
        }

    }));
    Y.Test.Runner.add(suite);
});
