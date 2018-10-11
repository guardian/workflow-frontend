import angular from 'angular';

import 'lib/content-service';
import { subscriptionsSupported, registerSubscription } from '../../lib/notifications';

import './dashboard-create.html';

angular
    .module('wfDashboardCreate', ['wfContentService'])
    .controller('wfDashboardCreateController', ['$scope', '$rootScope', 'wfContentService', function ($scope, $rootScope, contentService) {
        contentService.getTypes().then( (types) => {
            $scope.options = types;
        });

        $scope.createContent = function(contentType) {
            $scope.$emit('stub:create', contentType);
        };
        $scope.importContent = function() {
            $scope.$emit('content:import');
        };

        $scope.subscriptionsSupported = subscriptionsSupported();
        $scope.subscriptionStatus = null;

        $scope.registerSubscription = () => {
            $scope.subscriptionStatus = "Subscribing...";

            registerSubscription().then(() => {
                $scope.subscriptionStatus = "Subscribed!";
            }).catch((err) => {
                $scope.subscriptionStatus = null;
            });
        };

        // Mild hack to allow subscribing again if the filters change.
        $rootScope.$on("getContent", () => {
            $scope.subscriptionStatus = null;
        });
    }])
    .directive('wfDropdownToggle', ['$document', function($document){
        return {
            restrict: 'A',
            link: function(scope, element) {
                scope.toggleDropdown = function() { scope.showDropdown = !scope.showDropdown }
                element.bind('click', function(event) { event.stopPropagation(); });
                $document.bind('click', function(){ scope.showDropdown = false; scope.$apply();});
            }
        };
    }]);
