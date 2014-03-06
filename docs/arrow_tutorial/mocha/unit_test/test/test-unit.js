/*global chai, describe, it, before, YMedia*/
/*jslint expr:true */
var chai,
    Y;

describe('greeter-tests', function () {

    describe('greet', function () {

        before(function (done) {

            // Initialize chai and YUI
            if(typeof window  == "undefined" && typeof chai  == "undefined"){
                chai = require('chai');
            }
            else{
                chai = window.chai;
            }

            Y = YUI().use(['media-greeter'], function (){
                done();
            });

        });

        it('test name', function (done) {

            chai.assert("1" === "1");

            var greeter = new Y.Media.Greeter();
            console.log(greeter.greet("Joe", "Smith"));
//
            chai.assert(greeter.greet("Joe", "Smith") === "Smith, Joe");

            done();

        });

    });

});