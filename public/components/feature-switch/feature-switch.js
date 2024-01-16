/**
 * Directive to allow users to toggle the KT button.
 *
 * Stores the changed setting via the user preferences service.
 */

import angular from 'angular';
import featureSwitch from './feature-switch.html';

angular.module('wfFeatureSwitch', ['wfPreferencesService', 'wfIcons'])
    .directive('wfFeatureSwitch', [wfFeatureSwitchDirective]);

function wfFeatureSwitchDirective() {
    return {
        restrict: 'E',
        scope: true,
        template: featureSwitch,
        controller: ['$scope', 'wfPreferencesService', wfFeatureSwitchController],
        controllerAs: 'ctrl',
    };
}

function wfFeatureSwitchController ($scope, wfPreferencesService) {

    function checkPreference(){
    wfPreferencesService.getPreference('featureSwitch').then((data) => { $scope.featureSwitch = data;})
    }

    checkPreference();

    $scope.toggleFeatureSwitch = () => {
        let newValue = !$scope.featureSwitch;
        wfPreferencesService.setPreference('featureSwitch', newValue).then(window.location.reload());
     }
}