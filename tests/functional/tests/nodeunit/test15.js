/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor10 = function(test){

    var test15 = fs.readFileSync("data/actual_op/test15.txt", "utf-8")
    var expected_test15 = fs.readFileSync("data/expected_op/expected_test15.txt", "utf-8")

    test.equal(test15,expected_test15,"The output of arrow controller_descriptor_fix.json --bowser=firefox --lib=./lib1.js is not correct");
    test.done();
};