/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/30/12
 * Time: 1:52 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * Created with JetBrains WebStorm.
 * User: vpranav
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testSomething = function(test){

    var test3 = fs.readFileSync("node/test1.txt", "utf-8")

    test.equal("v0.0.0",test3);
    test.done();
};