/*
 * The purpose of this class is to abstract the various tests you'd have on a tab-view 
 * There are several methods and each of them are abstracted in such a way as to
 * not assume how the module was implemented 
 * The name of this YUI module is "media-test-tabview"
 */
YUI.add("arrow-test-tabview", function(Y) {

    var A = Y.Assert;
    var L = Y.Lang;

    var self = Y.namespace("Arrow.Test").TabView = {

    	//Confirms the tabs are present
        validateStructure: function(node, tabs, mods) {
            for(tab in tabs) {
                var tabNode = node.one(tabs[tab]);
                A.isNotNull(tabNode, "tab is present: " + tabs[tab]);
            }
            
            //Confirms the first module displays correctly, with the associated content below it
            for(mod in mods) {
                var modNode = node.one(mods[mod]);
                A.isNotNull(modNode, "module is present: " + mods[mod]);
                if(0 == mod) {
                    A.areNotEqual(modNode.getStyle("display"), "none", "module should be displayed: " + mods[mod]);
                } else {
                    A.areEqual(modNode.getStyle("display"), "none", "module should not be displayed: " + mods[mod]);
                }
            }
        },

        //Confirms each tab is represented as a link
        validatePresence: function(node, tabNames) {
            for(i in tabNames) {
                var tabName = tabNames[i];
                var link = node.oneLink(tabName);
                A.isNotNull(link, "Tab must exist: " + tabName);
            }
        },

        //Clicks through the tabs and makes sure they are displayed correctly
        validateSelection: function(node, tabName, modName) {
            var tabNode = node.one(tabName);
            var modNode = node.one(modName);

            A.areEqual(modNode.getStyle("display"), "none", "module should not be displayed: " + modName);

            A.isNotNull(tabNode, "tab is present: " + tabName);
            tabNode.simulate("click");

            A.areNotEqual(modNode.getStyle("display"), "none", "module should be displayed: " + modName);
        }

    };

    var Node = function() {}
    Node.prototype.oneLink = function(linkText, tagName) {
        if(!tagName) tagName = "a";
        var useRegex = !L.isString(linkText);

        var links = this.getElementsByTagName(tagName);
        for(var i = 0; i < links.size(); i++) {
            var link = links.item(i);
            if(useRegex) {
                if(linkText.test(link.get("text"))) {
                    return link;
                }
            } else if(linkText == link.get("text")) {
                return link;
            }
        }

        return null;
    }
    Y.augment(Y.Node, Node);

}, "0.1", { requires:["event", "node", "node-event-simulate", "test"]});
