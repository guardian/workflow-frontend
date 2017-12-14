
import angular from 'angular';

import {wfErrorExceptionHandlerDecorator} from 'lib/error-service';
import 'lib/supported-browser-service';

import userMessageTemplate from './user-message.html';

angular.module('wfUserMessage', ['wfSupportedBrowserService'])
    .config(['$provide', wfUserMessageConfig])
    .directive('wfUserMessage', ['wfSupportedBrowserService', wfUserMessageDirectiveFactory]);

/**
 * Config which provides an exception handler decorator for handling errors, and
 * appends user message directive to the page body.
 */
function wfUserMessageConfig($provide) {
    $provide.decorator('$exceptionHandler', ['$delegate', '$injector', wfErrorExceptionHandlerDecorator]);

    angular.element(document.body).prepend('<wf-user-message class="user-message__container"></wf-user-message>');
}


/**
 * Directive for displaying the message. Listens for "userMessage.show" and "userMessage.hide" events
 * broadcast from wfErrorExceptionHandler (when an error occurs) or elsewhere
 */
function wfUserMessageDirectiveFactory(wfSupportedBrowserService) {
    return {
        restrict: 'E',
        scope: true,
        template: userMessageTemplate,
        controller: function($scope, $element, $attrs, $timeout) {

            this.showMessage = (msg) => {

                $scope.messageData = msg;
                $scope.messageData.showMessage = true;

                if ($scope.messageData.timeout) {
                    $timeout(this.hideMessage, $scope.messageData.timeout);
                }

                if ($scope.messageData.showOverlay) {
                    $scope.$overlayElem.addClass('irrecoverable-error-overlay--show');
                }

            };

            this.hideMessage = () => {

                $scope.messageData.showMessage = false;
                $scope.$overlayElem.removeClass('irrecoverable-error-overlay--show');
            };

            $scope.$on('userMessage.show', ($event, messageDetails) => {
                this.showMessage(messageDetails);
            });

            $scope.$on('userMessage.clear', () => {
                this.hideMessage();
            });

            // check takes place here to ensure the component has loaded before messages are sent
            wfSupportedBrowserService.checkSupportedBrowser();

        },
        controllerAs: 'ctrl',

        link: function($scope, $elem) {

            $scope.$overlayElem = angular.element('<div class="irrecoverable-error-overlay"></div>');
            $elem.after($scope.$overlayElem);
        }
    };
}
