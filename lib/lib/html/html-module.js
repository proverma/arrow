/*jslint browser: true, nomen: true, indent: 2 */
/*globals YUI*/

/**
  * The Module Test Suite lets you pass in a data structure defining asserts
  * that need to be made for a module and automatically formats them in a format
  * YUITest can execute
  *
  * @module html-module-lib
  * @namespace Test
  * @class Module
  */
YUI.add("html-module-lib", function (Y) {
  "use strict";

  var Module = function (config) {
    Module.superclass.constructor.call(this, config);

    var prop,
      modNode = null,
      testObject,
      tests = this.asserts,
      Assert = Y.Assert,
      addAssert = function (selector, node) {
        return function () {
          Assert.isNode(node.one(selector), " '" + selector + "' is missing from Module markup");
        };
      };

    if (this.id) {
      modNode = Y.one('#' + this.id);

      this["Module Presence"] = function () {
        Assert.isNode(modNode, "Module is missing");
      };

      if (tests && (typeof tests === "object")) {
        for (prop in tests) {
          if (tests.hasOwnProperty(prop)) {
            this["Test Module " + prop] = addAssert(tests[prop], modNode);
          }
        }
      }
    }
  };

  Y.extend(Module, Y.Test.Case);
  Y.Test.Module = Module;

}, "0.1", { requires: ["node", "test", "oop", "dom-lib"] });