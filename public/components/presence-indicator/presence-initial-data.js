import _ from "underscore"

function wfPresenceInitialData ($rootScope) {

    var initialData = {};
    var empty = [];             // always return same object for equality checking
    
    $rootScope.$on("presence.subscribed", (ev, data) => {
        initialData = _.reduce(data.subscribedTo, (newData, item) => {
            newData[item.subscriptionId] = item.currentState;
            return newData;
        }, {});
    });

    return {
        "getForId": (id) => initialData[id] || empty
    };

}

export { wfPresenceInitialData };
