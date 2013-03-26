
QUnit.test('#test get title', function (assert) {
	var title = "Yahoo! Finance - Business Finance, Stock Market, Quotes, News";
	assert.ok(title == document.title);
});