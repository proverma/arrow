
function ugly_assert(expr, msg) {
	if (!expr) throw new Error(msg || 'failed');
}

suite('Array', function(){
	setup(function(){
	});

	suite('#indexOf()', function(){
		test('should return -1 when not present', function(){
			ugly_assert(-1 == [1,2,3].indexOf(4));
		});

		test('should be able to use chai', function(){
			var foo = 'bar'
				, beverages = { tea: [ 'chai', 'matcha', 'oolong' ] };

			var chai;

			if(typeof window  == "undefined" && typeof chai  == "undefined"){
				chai = require('chai');
			}
			else{
				chai = window.chai;
			}

			chai.assert.typeOf(foo, 'string', 'foo is a string');
			chai.assert.equal(foo, 'bar', 'foo equal `bar`');
			chai.assert.lengthOf(foo, 3, 'foo`s value has a length of 3');
			chai.assert.lengthOf(beverages.tea, 3, 'beverages has 3 types of tea');

		});
	});
});

