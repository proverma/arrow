/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var stream = function () {
    this.callbacks = {};
}

stream.prototype.on = function (evName, callback) {
    this.callbacks[evName] = callback;
};

stream.prototype.notify = function (evName, data) {
    if(this.callbacks.hasOwnProperty(evName)) {
        this.callbacks[evName].call(this, data);
    }
};

var process = function (path, args) {
    this.path = path;
    this.args = args;
    this.callbacks = {};

    this.stdout = new stream();
    this.stderr = new stream();
}

process.prototype.on = function (evName, callback) {
    this.callbacks[evName] = callback;
};

process.prototype.notify = function (evName, data) {
    if(this.callbacks.hasOwnProperty(evName)) {
        this.callbacks[evName].call(this, data);
    }
};

var child_process = {
    curProcess: null,

    spawn: function(path, args) {
        child_process.curProcess = new process(path, args);
        return child_process.curProcess;
    }
}

module.exports = child_process;

