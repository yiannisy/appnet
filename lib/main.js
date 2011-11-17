// Import the APIs we need.
var contextMenu = require("context-menu");
var Request = require("request").Request;
var selection = require("selection");
var pageMod = require("page-mod");
var {Cc,Ci} = require("chrome");
var notifications = require("notifications");
var ss = require("simple-storage");

 
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

function AppNet() {}

AppNet.prototype = {

	// Initialisation and termination functions
	start : function() {
		ss.storage.requests = {};
		this.addToListener();
		notifications.notify({
				title:"AppNet",
					text:"Starting AppNet Extension",
	    });
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

	// checks whether this is a request to NetFlix
	is_netflix_flow: function(subject) {
		var http_channel = subject.QueryInterface(Components.interfaces.nsIHttpChannelInternal);
		var host = http_channel.getRequestHeader("Host");
		// Level-3 hostname pattern.
		if (host.match(/lcdn.nflximg.com/))
			return true;
		// LimeLight hostname pattern.
		else if (host.match(/.vo.llnwd.net/))
			return true;
		// Akamai hostname pattern (this should be made more specific)
		else if (host.match(/nflximg.com/))
			return true;
		else
			return false;
	},

	// creates a key from the request subject
	get_key_from_subject: function(subject) {
		var http_channel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
		var host = http_channel.getRequestHeader("Host");
		var tcp_channel = subject.QueryInterface(Components.interfaces.nsIHttpChannelInternal);
		var ip = tcp_channel.remoteAddress;
		var key = host + ip;
		return key;
	},

	process_http_request: function(subject) {
		var http_channel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
		var host = http_channel.getRequestHeader("Host");
		var tcp_channel = subject.QueryInterface(Components.interfaces.nsIHttpChannelInternal);
		var ip = tcp_channel.remoteAddress;
		var key = host + ip;

		// does this url exists in our DB?
		var netflix_flag = this.is_netflix_flow(subject);
		if (typeof(ss.storage.requests[key]) == 'undefined'){
			// var browser = this.getBrowserFromChannel(subject);
			// console.log(browser);
			ss.storage.requests[key] = {'host':host, 'ip':ip, 'is_netflix':netflix_flag};
			// inform the controller for NetFlix traffic
			if (netflix_flag){
				var req = Request({
						url:"http://homenets-dev.stanford.edu/appnet/",
						content:ss.storage.requests[key],
						//						onComplete: function (response) {
						//console.log("Received response from appnet server");
						//console.log(response);
						//},
					});
				req.post();
				console.log(ss.storage.requests[key]["host"] + "(" + ss.storage.requests[key]['ip']  + ")" + ':' + ss.storage.requests[key]["is_netflix"]);
			}
		}
		//		if (netflix_flag){
		//	console.log(ss.storage.requests[key]["host"] + "(" + ss.storage.requests[key]['ip']  + ")" + ':' + ss.storage.requests[key]["is_netflix"]);
		//}

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

			if (notificationCallbacks instanceof Components.interfaces.nsIDOMWindow){
				console.log("notificationcallbacks has nsIDOMWindow interface");
			}
			else {
				console.log("notification callbacks doesn't have nsIDOMWindow interface");
			}
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