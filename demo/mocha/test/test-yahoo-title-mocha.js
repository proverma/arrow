var chai;

describe('test-yahoo-title-mocha', function(){
    describe('test', function(){

        before(function (done) {

            // Initialize chai and YUI
            if(typeof window  == "undefined" && typeof chai  == "undefined"){
                chai = require('chai');
            }
            else{
                chai = window.chai;
            }
            done();

        });

        it('has correct title', function(done){
            chai.assert("Yahoo" == document.title);
            done();

        });
    });
});