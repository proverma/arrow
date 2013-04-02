describe('#login', function(){
	describe('#get page title', function(){
		it('should get a correct title', function(){
			var title = "Yahoo! Search - Web Search";
			assert(title == document.title);
		})
	})
})