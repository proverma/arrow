/**
 * Created with JetBrains WebStorm.
 * User: vpranav
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testSomething = function(test){

    var test1 = fs.readFileSync("./test1.txt", "utf-8")

    test.equal("v0.0.53",test1);
    test.done();
};