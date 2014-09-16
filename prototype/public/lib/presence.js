angular.module('wfPresenceService', []).
  factory('wfPresenceService', ['$rootScope', function($rootScope) {

    var self = {};

    //self.endpoint = "ws://presence-Presence-OWDNPQCCLV33-1270668035.eu-west-1.elb.amazonaws.com/socket";
    self.endpoint = "ws://localhost:9000/socket";

    var _socket = new WebSocket(self.endpoint);

    _socket.onerror   = function(ev) {
      $rootScope.$broadcast("presence.connection.error", ev);
    }
    _socket.onopen = function(ev) {
      $rootScope.$broadcast("presence.connection.success");
      /* XXX */
      console.log("onopen, doing a test subscribe");
      self.articleSubscribe("1234");
    }
    /* XXX temporary debugging message handler */
    _socket.onmessage = function(ev) {
      messageHandler(ev.data);
    }

    var messageHandlers = {
      "connectionTest": function() {
        /* XXX TODO : how should I reply to this connectionTest request? */
        //console.log("recieved connection test request from server")
      },
      "subscribed": function(data) {
        console.log("subscribed", data);
        self.clientId = data.clientId;
        /* XXX TODO : share the initial state, which will have been sent to us here */
        console.log("subscribtions updated:", self.subscriptions);
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

    /* XXX TODO : allow submitting an array to this */
    function makeSubscriptionRequest(articleId) {
      return makeRequest("subscribe", {
        "person": self.person,
        "subscriptionIds": [articleId]
      });
    }

    function sendJson(data) {
      _socket.send(JSON.stringify(data));
    }

    /* provide an optional callback to execute when the message
     * arrives. Either way an event will be broadcast. */
    self.articleSubscribe = function(articleId, cb) {
      sendJson(makeSubscriptionRequest(articleId));
      /* XXX TODO : decide what to do about the cb arg */
    }

    return self;

  }]);
