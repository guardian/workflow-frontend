/**
 * Directive to allow users to toggle the table compact view.
 *
 * Stores the changed setting via the user preferences service.
 */

import angular from 'angular';
import compactorToggle from './compactor-toggle.html';

angular.module('wfCompactorToggle', ['wfPreferencesService', 'wfIcons'])
    .directive('wfCompactorToggle', [wfCompactorToggleDirective]);

function wfCompactorToggleDirective() {
    return {
        restrict: 'E',
        scope: true,
        template: compactorToggle,
        controller: ['$scope', 'wfPreferencesService', wfCompactorToggleController],
        controllerAs: 'ctrl',
    };
}

function wfCompactorToggleController ($scope, wfPreferencesService) {
    $scope.compactView = {
        visible: false // Compact view off by default
    };

    wfPreferencesService.getPreference('compactView').then((data) => { // query prefs for compact view
        $scope.compactView = data;
        setUpWatch();
    }, setUpWatch);

    function setUpWatch () {
        $scope.$watch('compactView', (newValue) => { // store any change to compact view as a pref
            wfPreferencesService.setPreference('compactView', newValue);
        }, true);
    }
}
