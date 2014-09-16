angular.module('wfPresenceService', []).
  factory('wfPresenceService', ['$rootScope', function($rootScope) {

    console.log("wfPresenceService factory");

    var self = {};

    self.endpoint = "ws://presence-Presence-OWDNPQCCLV33-1270668035.eu-west-1.elb.amazonaws.com/socket";

    var _socket = new WebSocket(self.endpoint);

    _socket.onerror   = function(ev) {
      $rootScope.$broadcast("presence.connection.error", ev);
    }
    _socket.onopen = function(ev) {
      $rootScope.$broadcast("presence.connection.success");
    }
    /* XXX temporary debugging message handler */
    _socket.onmessage = function(ev) {
      console.log("onmessage", ev);
    }

    self.browserId = "pmrtest";
    self.name = "pmrtest";
    self.UUId = "b3c1db8a-bc59-428e-a244-5d4ab8a5ac19";

    function now() {
      return (new Date()).getTime();
    }

    function makeSubscriptionRequest(articleId) {
      return {
        "browserId": self.browserId,
        "name": self.name,
        "UUId": self.UUId,
        "articleId": articleId,
        "joinedTime": now()
      };
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
