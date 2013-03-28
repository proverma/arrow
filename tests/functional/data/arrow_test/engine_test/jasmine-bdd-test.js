describe('get page title', function(){
	it('should pass', function(){
		var title = "Yahoo! Finance - Business Finance, Stock Market, Quotes, News";
		expect(document.title).toEqual(title);
	});
});