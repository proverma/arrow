/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_version = function(test){

    var test1 = fs.readFileSync("data/actual_op/test1.txt", "utf-8")
    var expected_test1 = fs.readFileSync("data/expected_op/expected_test1.txt", "utf-8")

    test.equal(test1,expected_test1,"The output of arrow --version is not correct");
    test.done();
};