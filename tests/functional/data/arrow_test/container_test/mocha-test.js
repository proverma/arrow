//
describe('#login', function(){
	describe('#get page title', function(){
		it('should get a correct title', function(){
			var title = "Yahoo! Finance - Business Finance, Stock Market, Quotes, News";
			assert(title == document.title);
		})
	})
})