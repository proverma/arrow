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

process.prototype.send = function  (message) {
    this.message = message;
    if (!this.curProcess) {
        // child process
        if (message.results) {
            this.callbacks['message'](message);
        }
    } else if (this.callbacks['message']) {
        this.callbacks['message'](message);
    }
};

var child_process = {
    curProcess: null,

    on: function (evName, callback) {
        this.callbacks[evName] = callback;
    },

    spawn: function(path, args) {
        child_process.curProcess = new process(path, args);
        return child_process.curProcess;
    },

    fork: function (path, args) {
        var ret = this.spawn(path, args);
        return ret;
    }
}

module.exports = child_process;

