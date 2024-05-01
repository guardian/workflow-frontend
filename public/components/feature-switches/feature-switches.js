/**
 * Directive to allow users to toggle the KT button.
 *
 * Stores the changed setting via the user preferences service.
 */

import angular from 'angular';
import featureSwitches from './feature-switches.html';
import _ from 'lodash';

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


class FeatureSwitches {
    constructor(switches, entries) {
        // this.switches should be a single object with the type { [key]: value }
        this.switches = switches
        this.entries = entries;
    }

    update(incomingSwitches) {
        // Update the switches with a partial set
        this.switches = {...this.switches, ...incomingSwitches}
        this.entries.length = 0;
        Object.entries(this.switches).forEach(featureSwitch => {
            this.entries.push(featureSwitch)
        })
    }
}

function wfFeatureSwitchesController ($scope, wfPreferencesService) {
    const featureSwitchKeys = [];
    $scope.readableNames = {}

    const getDefaultFeatureSwitchValues = () => {
        const switches = {};
        featureSwitchKeys.forEach(key => switches[key] = false);
        return switches;
    }

    // Feature switches are provided to the directive as an array of entries because it's simpler to iterate through in ng-repeat
    $scope.featureSwitchEntries = Object.entries(getDefaultFeatureSwitchValues()).filter(featureSwitch => featureSwitchKeys.includes(featureSwitch[0]))

    const featureSwitches = new FeatureSwitches(getDefaultFeatureSwitchValues(), $scope.featureSwitchEntries)

    const updateLocalFeatureSwitchValues = (featureSwitchResult) => {
        const incomingFeatureSwitches = featureSwitchResult;
        if (_.isObject(incomingFeatureSwitches)){
            featureSwitches.update(incomingFeatureSwitches);
            $scope.$apply()
        } else {
            // It is useful to discard invalid values in the feature switch record 
            console.error(`Feature switch values were unexpectedly not an object. Resetting feature switches.`);
            featureSwitches.update(getDefaultFeatureSwitchValues())
        }
    }

    wfPreferencesService.getPreference('featureSwitches').then((gotPreferences) => { 
        if (gotPreferences){
            updateLocalFeatureSwitchValues(gotPreferences)
        }
    })
    
    $scope.updateFeatureSwitchPreference = (key, value) => {
            featureSwitches.update({[key]: value});
            wfPreferencesService.setPreference('featureSwitches', featureSwitches.switches)
                .then(setTimeout(() => {window.location.reload()}, 500));
    }
}