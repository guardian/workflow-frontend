angular.module('wfPresenceService', []).
  factory('wfPresenceService', ['$rootScope', function($rootScope) {

    var self = {};

    //self.endpoint = "ws://presence-Presence-OWDNPQCCLV33-1270668035.eu-west-1.elb.amazonaws.com/socket";
    self.endpoint = "ws://localhost:9000/socket";

    var _socket = new Promise( (resolve, reject) => {

      var messageHandlers = {
        "connectionTest": function() {
          /* XXX TODO : how should I reply to this connectionTest request? */
          // console.log("recieved connection test request from server")
        },
        "subscribed": function(data) {
          self.clientId = data.clientId;
          /* XXX TODO : share the initial state, which will have been sent to us here */
        }
      }

      function messageHandler(msgJson) {
        var msg = JSON.parse(msgJson);
        if(typeof messageHandlers[msg.action] === "function") {
          messageHandlers[msg.action](msg.data);
        } else {
          console.log("receive unknown message action: " + msg.action);
          $rootScope.$broadcast("presenence.error.unknownAction", msg);
        }
      }

      var s = new WebSocket(self.endpoint);
      s.onerror   = reject;
      s.onopen    = function () { resolve(s); }
      s.onmessage = function(ev) { messageHandler(ev.data); }
    });

    /* XXX TODO : properly handle errors */
    // _socket.onerror   = function(ev) {
    //   $rootScope.$broadcast("presence.connection.error", ev);
    // }

    /* broadcast successful connection to the rest of the application */
    _socket.then(function() {
      $rootScope.$broadcast("presence.connection.success");
    });

    self.person = {
      firstName : "Paul",
      lastName  : "Roberts",
      email     : "paul.roberts@guardian.co.uk",
      browserId : "12345",
      googleId  : "123456"
    };

    function makeRequest(action, data) {
      return { action: action, data: data };
    }

    function makeSubscriptionRequest(articleIds) {
      return makeRequest("subscribe", {
        "person": self.person,
        "subscriptionIds": articleIds
      });
    }

    /* returns a promise */
    function sendJson(data) {
      return _socket.then(function(socket) {
        socket.send(JSON.stringify(data));
      });
    }

    /* provide an optional callback to execute when the message
     * arrives. Either way an event will be broadcast. */
    self.articleSubscribe = function(articleIds, cb) {
      var ids = (typeof articleIds == "array") ? articleIds : Array(articleIds);
      var p = sendJson(makeSubscriptionRequest(ids));
      if(typeof cb == "function") { p.then(cb); }
    }

    self.articleSubscribe("1234");

    return self;

  }]);
