
function assert(expr, msg) {
	if (!expr) throw new Error(msg || 'failed');
}

suite('Array', function(){
	setup(function(){
	});

	suite('#indexOf()', function(){
		test('should return -1 when not present', function(){
			assert(-1 == [1,2,3].indexOf(4));
		});
	});
});