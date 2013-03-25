/*jslint forin:true sub:true anon:true sloppy:true stupid:true nomen:true node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var path = require('path'),
	fs = require('fs');

var log4js = require("log4js");
var serverManagerLogger = new log4js.getLogger("arrowServerManager");
var arrowConfig = require('../config/config');
var portchecker = require('../ext-lib/portchecker');
var child;

var servermanager = module.exports = {};

/**
 * get local host ip(return first one)
 * @return {*}
 */
servermanager.getLocalhostIPAddress = function () {
	'use strict';
	var os = require('os'),
		k,
		k2,
		address,
		interfaces = os.networkInterfaces(),
		addresses = [];

	for (k in interfaces) {
		for (k2 in interfaces[k]) {
			address = interfaces[k][k2];
			if (address.family === 'IPv4' && !address.internal) {
				addresses.push(address.address);
			}
		}
	}
	if (addresses.length > 0) {
		return addresses[0];
	}
}

/**
 * get ip hostname/address from arrow server
 * @return {*}
 */
servermanager.getArrowServerHost = function () {
	var statusfile = path.join(arrowConfig['arrowModuleRoot'], "tmp", "arrow_server.status"), ip;
	try {
		if (fs.statSync(statusfile).isFile()) {
			var file = fs.readFileSync(statusfile, 'utf8'),
				ipreg = /^((http|https):\/\/)?((.*?):(.*?)@)?([a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])((\.[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])*)(:([0-9]{1,5}))?/;
			// like http://10.82.133.96:10000 or https://localhost:10000
			if (file.match(ipreg)) {
				ip = file.match(ipreg)[0]; //extract ip address
			}
		}
	} catch (e) {
		serverManagerLogger.debug("Arrow server status does not exist");
	}
	return ip;
}

/**
 * get arrow server ip from status file
 * @return {*}
 */
servermanager.getArrowServerHostIP = function () {
	var statusfile = path.join(arrowConfig['arrowModuleRoot'], "tmp", "arrow_server.status"), ip;
	try {
		if (fs.statSync(statusfile).isFile()) {
			var file = fs.readFileSync(statusfile, 'utf8'),
				ipreg = /[^((http|https):\/\/)]([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:([0-9]{1,5})+)/;
			// like http://10.82.133.96:10000
			if (file.match(ipreg)) {
				ip = file.match(ipreg)[0]; //extract ip address
			}
		}
	} catch (e) {
		serverManagerLogger.debug("Arrow server status does not exist");
	}
	return ip;
}

/**
 * return all ips found in local machine
 * @return {Array}
 */
servermanager.getAllIPAddressForArrowServer = function () {
	// maybe we should add method to get "proper" ip if the local host has multiply ip address
	var os = require('os'),
		interfaces = os.networkInterfaces(),
		k,
		k2,
		addresses = [];

	for (k in interfaces) {
		for (k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			if (address.family == 'IPv4' && !address.internal) {
				addresses.push(address.address)
			}
		}
	}
	return addresses;
};

/**
 * check arrow server status to see if it's running on specify host/port
 * @param cb
 * @return {*}
 */
servermanager.getArrowServerStatus = function (cb) {

	var serverip = this.getArrowServerHostIP();
	if (!serverip)return cb(false);

	var ipreg = /[^((http|https):\/\/)]([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:([0-9]{1,5})+)/;
	//      like http://10.82.133.96:10000
	if (serverip.match(ipreg)) {
		serverip = serverip.match(ipreg)[0]; //extract ip address
	}

	var split = serverip.split(":");
	if (!split || !split.length >= 2)return cb(false);
	portchecker.isOpen(split[split.length - 1], split[split.length - 2], function (opened, port, host) {
		if (opened) {
			serverManagerLogger.info("server is running at:" + serverip + " according to status file");
			return cb(opened);
		} else {
			serverManagerLogger.info("server is not running at:" + serverip + " according to status file");
			return cb(opened);
		}

	});
};

/**
 * start arrow server
 */
servermanager.startArrowServer = function (cb) {

	// var forever = require("forever");
	// forever.start(path.join(self.config['arrowModuleRoot'], "arrow_server", "server.js"), {debug:true});

	var childProcess = require("child_process");
	child = childProcess.fork(path.join(arrowConfig['arrowModuleRoot'], "arrow_server", "server.js"), [], {});
	child.on('message', function (m) {
		serverManagerLogger.info("arrow server message:" + m);
	});
	child.on("exit", function () {
		serverManagerLogger.info("arrow server exit!");
	});

	var tid, maxTry = 10, checkServerStatusimeout = 500;
	tid = setInterval(function () {
		if ((maxTry--) === 0) {
			clearInterval(tid);
			var arrowServerHost = servermanager.getArrowServerHost();
			if (arrowServerHost !== undefined) {
				return cb(true);
			} else {
				serverManagerLogger.error(" Start arrow server failed ");
				return cb(false);
			}
		} else {
			arrowServerHost = servermanager.getArrowServerHost();
			if (arrowServerHost !== undefined) {
				clearInterval(tid);
				return cb(true);
			}
		}
	}, checkServerStatusimeout);

};

/**
 * stop arrow server,default kill the server started by this manager
 * if killall is given ,will kill all arrow_server
 * @param force force kill
 */
servermanager.stopArrowServer = function (killall) {

	if (child) {
		child.kill(); // send 'SIGTERM'
		serverManagerLogger.info("Send sig term to arrow server !");
	}
	if (killall) {
		var exec = require('child_process').exec;
		exec('ps aux|grep ' + path.join(arrowConfig['arrowModuleRoot'], "arrow_server", "server.js") + '|grep -v \'grep\'|awk \'{print $2}\'|xargs kill -9',
			function (error, stdout, stderr) {
				serverManagerLogger.debug('Kill all arrow server stdout: ' + stdout);
				serverManagerLogger.debug('Kill all arrow server stderr: ' + stderr);
				if (error !== null) {
					serverManagerLogger.debug('exec error: ' + error);
				}
			});
	}
};