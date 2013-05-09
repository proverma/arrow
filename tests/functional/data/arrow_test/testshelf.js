YUI({
    useConsoleOutput: true,
    useBrowserConsole: true,
    logInclude: { TestRunner: true }
}).use('node', 'test', 'console', function (Y) {
    "use strict";
    var suite = new Y.Test.Suite("Common: shelf");
    suite.add(new Y.Test.Case({

        "test shelf": function () {
            var baseUrl = window.location,
                boxes;
            boxes = Y.all('#toc ul li');
            Y.Assert.areEqual(12, boxes.size());
            Y.Assert.areEqual('http://weather.yahoo.com/forecast/USCA0987_f.html', boxes.item(0).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=bbcnews', boxes.item(1).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=yahoonews', boxes.item(2).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=techcrunch', boxes.item(3).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=yahoopersonaltech', boxes.item(4).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=allthingsd', boxes.item(5).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=yahoostocks', boxes.item(6).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=bbcbusiness', boxes.item(7).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=yahooomg', boxes.item(8).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=yui', boxes.item(9).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=yql', boxes.item(10).one('a').get('href'));
            Y.Assert.areEqual(baseUrl + 'read.html?id=ysearch', boxes.item(11).one('a').get('href'));
        }

    }));
    Y.Test.Runner.add(suite);
});
