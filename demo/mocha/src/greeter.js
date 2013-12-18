YUI.add("media-greeter", function (Y) {
    Y.namespace("Media");

    var Greeter = Y.Media.Greeter = function() {};
    
    //This is a simple method which takes two numbers
    //Add them and returns the value
    Greeter.prototype.greet = function(num1, num2) {
        return parseInt(num1)+parseInt(num2);
    }
}, "0.1", {requires:[]});

