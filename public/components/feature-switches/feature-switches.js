/**
 * Directive to allow users to toggle the KT button.
 *
 * Stores the changed setting via the user preferences service.
 */

import angular from 'angular';
import featureSwitches from './feature-switches.html';

angular.module('wfFeatureSwitches', ['wfPreferencesService', 'wfIcons'])
    .directive('wfFeatureSwitches', [wfFeatureSwitchesDirective]);

function wfFeatureSwitchesDirective() {
    return {
        restrict: 'E',
        scope: true,
        template: featureSwitches,
        controller: ['$scope', 'wfPreferencesService', wfFeatureSwitchesController],
        controllerAs: 'ctrl',
    };
}

function wfFeatureSwitchesController ($scope, wfPreferencesService) {


    
    function checkPreference(){
    wfPreferencesService.getPreference('featureSwitch').then((data) => { $scope.featureSwitch = data; console.log("in check", data);})
    }

    checkPreference();



    $scope.toggleFeatureSwitch = () => {
        console.log('featureSwitch here', $scope.featureSwitch)

        let newValue = !$scope.featureSwitch;
        wfPreferencesService.setPreference('featureSwitch', newValue).then(window.location.reload());
     }
}
