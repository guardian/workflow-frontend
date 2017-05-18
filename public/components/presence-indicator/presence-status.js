import _ from "lodash"

function wfPresenceCurrentState ($rootScope) {

    var currentState = {};
    var empty = [];             // always return same object for equality checking
    
    // reset
    $rootScope.$on("presence.subscribed", (ev, data) => {
        currentState = _.reduce(data.subscribedTo, (newData, item) => {
            newData[item.subscriptionId] = item.currentState;
            return newData;
        }, {});
    });

    // new information for currently subscribed item
    $rootScope.$on("presence.status", (ev, data) => {
        currentState[data.subscriptionId] = data.currentState;
    });

   return {
        "getForId": (id) => {
            var ret = (currentState[id] || empty);
            return ret;
        }
    };

}
export { wfPresenceCurrentState };
