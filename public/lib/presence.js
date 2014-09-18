define(["underscore"], function (_) {
  var module = angular.module('wfPresenceService', []);

  module.factory('wfPresenceService', ['$rootScope', function($rootScope) {

    var self = {};

    var articleStates = {};

    function articleDefaultState() {
      return { fromServer: false, currentState: [] }
    }

    function setArticleState(id, newStatus, fromServer) {
      articleStates[id] = { fromServer: fromServer,
                            currentSatate: newState };
    }

    self.getArticleState = function(id) {
      if(!articleStates[id]) {
        articleStates[id] = articleDefaultState();
      }
      return articleStates[id];
    }

    //self.endpoint = "ws://presence-Presence-OWDNPQCCLV33-1270668035.eu-west-1.elb.amazonaws.com/socket";
    self.endpoint = "ws://localhost:9000/socket";

    var _socket = new Promise( function(resolve, reject) {

      var messageHandlers = {
        "connectionTest": function() {
          /* XXX TODO : how should I reply to this connectionTest request? */
          // console.log("recieved connection test request from server")
        },
        "subscribed": function(data) {
          self.clientId = data.clientId;
          /* XXX TODO : share the initial state, which will have been sent to us here */
        },
        "updated": function(data) {
          console.log("XXX PMR receiving updated message");
          $rootScope.$broadcast("presence.status", data);
        }
      }

      function messageHandler(msgJson) {
        var msg = JSON.parse(msgJson);
        console.log("PMR: messageHandler", msgJson);
        if(typeof messageHandlers[msg.action] === "function") {
          messageHandlers[msg.action](msg.data);
        } else {
          console.log("receive unknown message action: " + msg.action);
          $rootScope.$broadcast("presence.error.unknownAction", msg);
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
        console.log("sending: " + JSON.stringify(data));
      });
    }

    function prepareInitialState() {
      var promise = new Promise()
    }

    /* provide an optional callback to execute when the message
     * arrives. Either way an event will be broadcast. */
    self.articleSubscribe = function(articleIds, cb) {
      console.log("subscribing to:", articleIds);
      var ids = (Array.isArray(articleIds)) ? articleIds : Array(articleIds);

      var p = sendJson(makeSubscriptionRequest(ids));
      if(typeof cb == "function") { p.then(cb); }
    }

    return self;

  }]);

  module.controller(
    'wfPresenceIndicatorController',
    [ "$scope", 'wfPresenceService', function($scope, wfPresenceService) {

    var id = $scope.content.composerId;
    console.log("wfPresenceIndicatorController: content: ", id);

    function getArticleState() {
      data = wfPresenceService.getArticleState();
      if(!data.fromServer) {
        return { status: "unknown", indicatorText: "unknown" }
      } else if(data.currentState.length == 0) {
        return { status: "free",
                 indicatorText: "free" };
      } else {
        return { status: data.currentState[0].clientId.status,
                 indicatorText: data.currentState[0].clientId.person.firstName };
      }
    }

    $scope.getStatus = function () {
      return getArticleState().status;
    }

    $scope.getIndicatorText = function () {
      return getArticleState().indicatorText;
    }

    // $scope.$on("presence.status", function(ev, data) {
    //   if(id === data.subscriptionId) {

    //   }
    //   console.log("wfPresenceIndicatorController event handler", data);
    // });


  }]);


});
