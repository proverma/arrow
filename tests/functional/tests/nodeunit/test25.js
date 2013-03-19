/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testMartiniCtllerwithScanPath = function(test){

    var test25 = fs.readFileSync("data/actual_op/test25.txt", "utf-8")
    var expected_test25 = fs.readFileSync("data/expected_op/expected_test25.txt", "utf-8")

    test.equal(test25,expected_test25,"The expected output for config.js should be "+expected_test25+ " but it is " +test25);
    test.done();
};