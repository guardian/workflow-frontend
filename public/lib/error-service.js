/**
 * Decorates Angular's exception handler. Broadcasts an event that can be
 * intercepted by the wfUserMessage directive for display.
 */
export function wfErrorExceptionHandlerDecorator($delegate, $injector) {

    return function wfErrorExceptionHandler(ex, cause) {
        var messageData = ex && errorData[ex.name] || errorData.Error;
        var $rootScope = $injector.get('$rootScope');
        $rootScope.$broadcast('userMessage.show', messageData);
        console.error(ex);
        $delegate(ex, cause);
    };
}

/**
 * Maps error types to data for the user-message component.
 */
var errorData = {
    'SessionError': {
        name: 'sessionError',
        dismissable: false,
        showOverlay: true,
        messageType: 'error'
    },
    'TimeoutError': {
        name: 'timeoutError',
        dismissable: false,
        showOverlay: true,
        messageType: 'error'
    },
    'PresenceError': {
        name: 'presenceError',
        dismissable: true,
        showOverlay: false,
        messageType: 'error'
    },
    'Error': {
        name: 'error',
        dismissable: true,
        showOverlay: false,
        timeout: 10000,
        messageType: 'error'
    }
};
