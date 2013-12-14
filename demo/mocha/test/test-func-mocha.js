var
    self = this,
    Y,
    chai,
    tabid = "#things",
    tabNode,
    tabTest;

describe('Array',function() {

    describe('#indexof()', function(){

        before(function (done) {

            // Initialize chai and YUI
            if(typeof window  == "undefined" && typeof chai  == "undefined"){
                chai = require('chai');
            }
            else{
                chai = window.chai;
            }

            Y = YUI().use(['node','arrow-test-tabview'], function (){
                done();
            });


        });

        it('test tab structure', function(done){

            tabNode = Y.one(document.body).one(tabid);
            tabTest = Y.Arrow.Test.TabView;
            tabTest.validateStructure(tabNode, ["#tab1", "#tab2", "#tab3"], ["#mod1", "#mod2", "#mod3"]);
            done();

        });

    });

});


