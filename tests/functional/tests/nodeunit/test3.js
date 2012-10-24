/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testUnit = function(test){

    var test3 = fs.readFileSync("data/actual_op/test3.txt", "utf-8")
    var expected_test3 = fs.readFileSync("data/expected_op/expected_test3.txt", "utf-8")

    test.equal(test3,expected_test3,"The output of arrow data/arrow_test/test-unit.js --lib=data/arrow_test/greeter.js is not correct");
    test.done();
};