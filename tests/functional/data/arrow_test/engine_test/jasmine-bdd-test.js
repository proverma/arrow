describe('get page title', function(){
	it('should pass', function(){
		var title = "Yahoo! Search - Web Search";
		expect(document.title).toEqual(title);
	});
});