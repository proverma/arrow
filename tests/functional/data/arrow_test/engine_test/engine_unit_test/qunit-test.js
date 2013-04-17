
QUnit.test('#length', function (assert) {
	var arr = [1, 2, 3];
	assert.ok(arr.length == 3);
});

QUnit.test('#indexOf()', function (assert) {
	var arr = [1, 2, 3];
	assert.ok(arr.indexOf(1) == 0);
	assert.ok(arr.indexOf(2) == 1);
	assert.ok(arr.indexOf(3) == 2);
});

QUnit.test('#length', function (assert) {
	assert.ok('foo'.length == 3);
});