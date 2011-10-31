// Import the APIs we need.
var contextMenu = require("context-menu");
var request = require("request");
var selection = require("selection");
var pageMod = require("page-mod");
var {Cc,Ci} = require("chrome");
var notifications = require("notifications");
 
// var pageMod = require("page-mod");
// pageMod.PageMod({
// 		include: "*.netflix.com",
// 			contentScript: 'window.alert("You came at NetFlix!");'
// 			});

var app_net;
function startAppNet() {
	app_net = new AppNet();
	app_net.start();
}

function stopAppNet() {
	app_net.stop();
    delete app_net;
    app_net = null;
}

function AppNet() {
}

AppNet.prototype = {
	// Keep a dictionary of the netflix hosts.
	// var netflix_hosts = {};

	// Initialisation and termination functions
	start : function() {
		this.netflix_hosts = {};
		this.addToListener();
	},
   
	stop : function() {
		this.removeFromListener();
	},
   
	addToListener: function() {
		// Register new request and response listener
		// Should be a new version of  Mozilla/Phoenix (after september 15, 2003)
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.addObserver(this, "http-on-examine-response",   false);
	},
   
	removeFromListener: function() {
		// Unregistering listener
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.removeObserver(this, "http-on-examine-response");
	},

	process_http_request: function(subject) {
		var http_channel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
		var host = http_channel.getRequestHeader("Host");
		var tcp_channel = subject.QueryInterface(Components.interfaces.nsIHttpChannelInternal);
		var ip = tcp_channel.remoteAddress;
		if (host.match(/.lcdn.nflximg.com/)) {
			var key = host + ip;
			if (typeof(this.netflix_hosts[key]) == 'undefined') {
				this.netflix_hosts[key] = 1; // TODO: here we should put a timestamp and expire entries.
				var txt_msg = "Streaming NetFlix from host " + host + " (" + ip + ")";
				notifications.notify({
						title:"AppNet",
						text:txt_msg,
				});
			}
		}
	},
	
	// This is the observerService's observe listener.
	observe: function(aSubject, aTopic, aData) {
		if (aTopic == 'http-on-examine-response') {
			this.process_http_request(aSubject);
			//aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
			//this.onModifyRequest(aSubject);
		}
	},

	getBrowserFromChannel: function (subject) {  
		try {  
			var notificationCallbacks =   
			subject.notificationCallbacks ? subject.notificationCallbacks : subject.loadGroup.notificationCallbacks;  
			
			if (!notificationCallbacks)  
				return null;  
			
			var domWin = notificationCallbacks.getInterface(Components.interfaces.nsIDOMWindow);  
			return gBrowser.getBrowserForDocument(domWin.top.document);  
		}  
		catch (e) {  
			dump(e + "\n");  
			return null;  
		}  
	}  


   
};

startAppNet();
console.log("Starting AppNet");