YUI().use('test', function (Y) {

    var suite = new Y.Test.Suite("Browser size test");
    suite.add(new Y.Test.Case({

        "test browser size equals parameter": function() {
            var expectedSize = this.testParams['windowSize'];

            Y.Assert.areEqual(parseInt(expectedSize.width, 10), window.outerWidth);
            Y.Assert.areEqual(parseInt(expectedSize.height, 10), window.outerHeight);
        }

    }));

    Y.Test.Runner.add(suite);
});
