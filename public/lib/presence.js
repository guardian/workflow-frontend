define([], function () {

    var module = angular.module('wfPresenceService', []);

    module.factory('wfPresenceService', ['$rootScope', function($rootScope) {

        var $scope = $rootScope.$new();

        var self = {};

        //self.endpoint = "ws://presence-Presence-OWDNPQCCLV33-1270668035.eu-west-1.elb.amazonaws.com/socket";
        self.endpoint = "ws://localhost:9000/socket";

        var messageHandlers = {
            "connectionTest": function() {
                /* XXX TODO : how should I reply to this connectionTest request? */
                // console.log("recieved connection test request from server")
            },
            "subscribed": function(data) {
                self.clientId = data.clientId;
                /* XXX TODO : share the initial state, which will have been sent to us here */
                $rootScope.$broadcast("presence.subscribed", data);
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

        var _socket = new Promise( function(resolve, reject) {
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

        self.articleSubscribe = function(articleIds) {
            var ids = (Array.isArray(articleIds)) ? articleIds : Array(articleIds);
            var p = sendJson(makeSubscriptionRequest(ids));
            p.then(function () { console.log("sent request: ", makeSubscriptionRequest(ids)) });
            return p;
        }

        return self;

    }]);

    module.controller(
        'wfPresenceSubscription',
        [ "$scope", "wfPresenceService", function($scope, wfPresenceService) {

            function getIds(content) {
                return _.pluck(_.flatten(_.values(content)), "composerId")
            }

            function doSubscription(ids) {
                var initialData = new Promise(function (resolve, reject) {

                    console.log("sending sub request");

                    wfPresenceService.articleSubscribe(ids);
                    $scope.$on("presence.subscribed", function (ev, data) {
                        console.log("presence.subscribed", data);
                        resolve();
                    });
                });
            }

            $scope.$watch(function($scope) {
                var content = $scope["contentByStatus"];
                return (content && getIds(content)) || [];
            }, function (newVal, oldVal) {
                if(newVal !== oldVal) {
                    doSubscription(newVal);
                }
                console.log("pmrLog-1 -> changed", newVal, oldVal);
            }, true);

        }]);

    module.controller('wfPresenceIndicatorController', [ "$scope", function($scope) {

        var id = $scope.content.composerId;
        console.log("wfPresenceIndicatorController: content: ", id);

        $scope.indicatorText = "";
        $scope.status = "unknown";

        $scope.$on("presence.status", function(ev, data) {
            if(id === data.subscriptionId) {
                if(data.currentState.length == 0) {
                    $scope.status = "free";
                    $scope.indicatorText = ""
                } else {
                    $scope.status = data.currentState[0].clientId.status;
                    $scope.indicatorText = data.currentState[0].clientId.person.firstName;
                }
            }
            console.log("wfPresenceIndicatorController event handler", data);
        });


    }]);


});
