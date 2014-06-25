/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("test-proxy-postbody-tests", function (Y) {

    //We initialize the suite object as a YUI test suite and with a suite title
    var suite = new Y.Test.Suite("Test for record:true");
    suite.add(new Y.Test.Case({

        //testing headers host
        "test the content of postbody": function () {

            var record = this.testParams.networkTrafficRecord,
                i, hasPostBody = false;

            Y.Assert.isNotNull(record, "The value of network record is null");
            for (i = 0; i < record.length; i += 1) {
                if (record[i].body && record[i].body.text) {
                    Y.Assert.isTrue(record[i].body.text.indexOf('q=select') === 0, "The content of POST body should start with 'q=select' ! " + record[i].body.text);
                    hasPostBody = true;
                }
            }
            Y.Assert.isTrue(hasPostBody, "The POST BODY of all record should not be empty!");
        }


    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires: ["test", "node"]});

