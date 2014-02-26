/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');
//var assert = require("assert"), require("assert-extras").assert;
//var assert = mixin({}, require("assert"), require("assert-extras").assert);

exports.testArrow_testDescriptor2 = function(test){

    var test4 = fs.readFileSync("data/actual_op/test4.txt", "utf-8")
    var expected_test4 = fs.readFileSync("data/expected_op/expected_test4.txt", "utf-8")

    //assert.isString(test5, "Not a string");

    test.equal(test4,expected_test4,"The output of arrow test_descriptor.json is not correct");
    test.done();
};