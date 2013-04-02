function assert(expr, msg) {
	if (!expr) throw new Error(msg || 'failed');
}

// in server side we have to require them
if(typeof window == "undefined" && typeof exports == "object"){
	expect = require('./expect');
}

describe('Array', function(){
	describe('#push()', function(){
		it('should append a value', function(){
			var arr = [];
			arr.push('foo');
			arr.push('bar');
			arr.push('baz');
			assert('foo' == arr[0]); // to test indentation
			assert('bar' == arr[1]);
			assert('baz' == arr[2]);
		})

		it('should return the length', function(){
			var arr = [];
			assert(1 == arr.push('foo'));
			assert(2 == arr.push('bar'));
			assert(3 == arr.push('baz'));
		})
	})
})

describe('Array', function(){
	describe('#pop()', function(){
		it('expect remove and return the last value', function(){
			var arr = [1,2,3];
			expect(arr.pop()).to.equal(3);
			expect(arr.pop()).to.equal(2);
			expect(arr.pop()).to.equal(1);
		})
		it('expect adjust .length', function(){
			var arr = [1,2,3];
			arr.pop();
			expect(arr.length).to.equal(2);
		})
	})
})

describe('#we can use yui share lib', function(){
	it('should be able to use yui instance and share lib', function(done){

		YUI().use('cookieUtil',function(Y){
			var cookieUtil = new Y.Arrow.CookieUtil({});
			cookieUtil.getCookiesFromHeader(null, function (err, cookies) {
				assert("illegal response" == err.message);
				done();
			});
		})

	})

})

