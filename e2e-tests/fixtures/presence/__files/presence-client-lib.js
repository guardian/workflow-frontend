// In-memory stub for the Guardian presence client library, served by the
// mock-presence WireMock container in place of the real external lib. It
// fulfils the `presenceClient` contract without any WebSocket: startConnection()
// resolves immediately and exposes window.__presenceMock__ so e2e tests can push
// presence updates directly (see e2e-tests/fixtures/presence/presenceMock.ts).
(function () {
  window.presenceClient = function (endpoint, person) {
    var handlers = {};

    function register(event, handler) {
      handlers[event] = handler;
    }

    var connection = {
      connectionId: "e2e-" + Math.random().toString(36).slice(2),
      on: register,
      register: register,
      subscribe: function () {
        return Promise.resolve();
      },
      startConnection: function () {
        window.__presenceMock__ = {
          connected: true,
          push: function (subscriptionId, currentState) {
            var handler = handlers["visitor-list-updated"];
            if (handler) {
              handler({
                type: "visitor-list-updated",
                subscriptionId: subscriptionId,
                currentState: currentState
              });
            }
          }
        };
        if (handlers["connection.open"]) {
          handlers["connection.open"]();
        }
        return Promise.resolve(this);
      }
    };

    return connection;
  };
})();
