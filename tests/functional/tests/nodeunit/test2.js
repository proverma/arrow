/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_help = function(test){

    var test2 = fs.readFileSync("./data/actual_op/test2.txt", "utf-8")
    var expected_test2 = fs.readFileSync("./data/expected_op/expected_test2.txt", "utf-8")
    test.equal(expected_test2,test2,"The output of arrow --help is not as expected");
    test.done();
};