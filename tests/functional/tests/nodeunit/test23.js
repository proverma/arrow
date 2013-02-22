/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testfuncwithScanNoExsitPath = function(test){

    var test23 = fs.readFileSync("data/actual_op/test23.txt", "utf-8")
    var expected_test23 = fs.readFileSync("data/expected_op/expected_test23.txt", "utf-8")

    var contains= test23.toString().indexOf(expected_test23)!=-1;
    test.equal(contains,true,"The expected output "+test23+ " should contains " +expected_test23);
    test.done();
};