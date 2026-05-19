/**
 * Directive to allow users to toggle the feature switch checkboxes.
 *
 * Stores the changed setting via the user preferences service.
 */

import angular from 'angular';
import featureSwitches from './feature-switches.html';

angular.module('wfFeatureSwitches', ['wfPreferencesService', 'wfFeatureSwitchService', 'wfIcons'])
    .directive('wfFeatureSwitches', [wfFeatureSwitchesDirective]);

function wfFeatureSwitchesDirective() {
    return {
        restrict: 'E',
        scope: true,
        template: featureSwitches,
        controller: ['$scope', 'wfPreferencesService', 'wfFeatureSwitchService', wfFeatureSwitchesController],
        controllerAs: 'ctrl',
    };
}

function wfFeatureSwitchesController ($scope, wfPreferencesService, wfFeatureSwitchService) {

    const featureSwitches = wfFeatureSwitchService.featureSwitches
    $scope.readableNames = wfFeatureSwitchService.readableNames
    
    // Feature switches are provided to the directive as an array of entries because it's simpler to iterate through in ng-repeat
    $scope.featureSwitchEntries = featureSwitches.entries
    
    $scope.updateFeatureSwitchPreference = (key, value) => {
            featureSwitches.update({[key]: value});
            wfPreferencesService.setPreference('featureSwitches', featureSwitches.switches)
                .then(setTimeout(() => {window.location.reload()}, 500));
    }
}