console.log("I HAVE ARRIVED");
angular.module('wfPresenceService', []).
  factory('wfPresenceService', [function() {

    var self = {};

    self.endpoint = "ws://presence-Presence-OWDNPQCCLV33-1270668035.eu-west-1.elb.amazonaws.com/socket";

    var _socket = null;

    self.browserId = "pmrtest";
    self.name = "pmrtest";
    self.UUId = "b3c1db8a-bc59-428e-a244-5d4ab8a5ac19";

    self.socket = function socket() {
      if(_socket == null) {
        _socket = new WebSocket(self.url);
      }
      return _socket;
    }

    function now() {
      return (new Date()).getTime();
    }

    self.makeSubscriptionRequest = function(articleId) {
      return {
        "browserId": self.browserId,
        "name": self.name,
        "UUId": self.UUId,
        "articleId": articleId,
        "joinedTime": now()
      };
    }

    window.test = self;
    return self;

  }]);
