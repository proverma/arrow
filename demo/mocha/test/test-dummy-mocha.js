var
    Y,
    chai;

describe('test-dummy-mocha', function(){
    describe('test', function(){

        before(function (done) {

            // Initialize chai and YUI
            if(typeof window  == "undefined" && typeof chai  == "undefined"){
                chai = require('chai');
            }
            else{
                chai = window.chai;
            }

            Y = YUI().use('node', function ()
            {
                done();
            });

        });

        it('has dummy one', function(done){

            chai.assert(1==1);
            done();

        });
    });
});