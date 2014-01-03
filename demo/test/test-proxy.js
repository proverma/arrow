/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("test-headers-tests", function (Y) {

    //We initialize the suite object as a YUI test suite and with a suite title
    var suite = new Y.Test.Suite("Test for record:true");
    suite.add(new Y.Test.Case({

        //testing headers host
        "test headers host shall be news.yahoo.com": function () {

            var record = this.testParams.networkTrafficRecord,
                i;

            Y.Assert.isNotNull(record, "The value of network record is null");
            for (i = 0; i < record.length; i += 1) {
                Y.Assert.areEqual("news.yahoo.com", record[i].headers.host, "Host is not news.yahoo.com for recordObject no. " + (i + 1));
            }
        }


    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires: ["test", "node"]});

