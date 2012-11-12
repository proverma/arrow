/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add("arrow-tabview", function (Y) {
    Y.namespace("Arrow");

    Y.Arrow.TabView = {
        load : function(tabid) {
            var tabview = new Y.TabView({srcNode: tabid});
            tabview.render();
        }
    }
}, "0.1", {requires:["tabview"]});

