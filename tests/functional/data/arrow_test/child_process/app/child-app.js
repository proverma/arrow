
var nopt = require("nopt"),
    knownOpts = {
        "foo" : Boolean,
        "bar" : Boolean,
        "baz" : Boolean,
        "qux" : Boolean,
        "corge" : Boolean,
        "grault" : Boolean
    },
    shortHands = {},
    parsed = nopt(knownOpts, shortHands, process.argv, 2);

var lib = require("../lib/child-lib");

if (parsed.foo) {
    lib.foo();
}

if (parsed.bar) {
    lib.bar();
}

if (parsed.baz) {
    lib.baz();
}

if (parsed.qux) {
    lib.qux();
}

if (parsed.corge) {
    lib.corge();
}

if (parsed.grault) {
    lib.grault();
}

