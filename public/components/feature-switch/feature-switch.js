/**
 * Directive to allow users to toggle the KT button.
 *
 * Stores the changed setting via the user preferences service.
 */

import angular from 'angular';
import featureSwitch from './feature-switch.html';
import _ from 'lodash';

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


export const KeyTakeawayFeatureSwitchKey = "keyTakeawaysSwitch";
export const QAndAFeatureSwitchKey = "qAndASwitch";

class FeatureSwitches {
    constructor(switches, entries) {
      this.switches = switches
      this.entries = entries;
    }

    update(incomingSwitches) {
        this.switches = {...this.switches, ...incomingSwitches}
        this.entries.length = 0;
        Object.entries(this.switches).forEach(featureSwitch => {
            this.entries.push(featureSwitch)
        })
    }
}

function wfFeatureSwitchController ($scope, wfPreferencesService) {
    const featureSwitchKeys = [KeyTakeawayFeatureSwitchKey, QAndAFeatureSwitchKey];
    $scope.readableNames = {
        [KeyTakeawayFeatureSwitchKey]: "Show Key Takeaways",
        [QAndAFeatureSwitchKey]: "Show Q and As",
    }

    const getDefaultFeatureSwitchValues = () => {
        const switches = {};
        featureSwitchKeys.forEach(key => switches[key] = false);
        return switches;
    }

    $scope.featureSwitchEntries = Object.entries(getDefaultFeatureSwitchValues())

    const featureSwitches = new FeatureSwitches(getDefaultFeatureSwitchValues(), $scope.featureSwitchEntries)

    const updateLocalFeatureSwitchValues = (featureSwitchResult) => {
        try {
            const incomingFeatureSwitches = featureSwitchResult;
            if (_.isObject(incomingFeatureSwitches)){
                featureSwitches.update(incomingFeatureSwitches);
                $scope.$apply()
            }
        } catch (e) {
            console.error(`Feature switch JSON is malformed, can't parse. Error message: ${e.message}`);
            featureSwitches.update(getDefaultFeatureSwitchValues())
        }
    }

    wfPreferencesService.getPreference('featureSwitches').then((result) => { 
        if (result){
            updateLocalFeatureSwitchValues(result)
        }
    })
    
    $scope.updateFeatureSwitchPreference = (key, value) => {
            featureSwitches.update({[key]: value});
            console.log(featureSwitches.switches)
            wfPreferencesService.setPreference('featureSwitches', featureSwitches.switches)
                .then(setTimeout(() => {window.location.reload()}, 500));
        
    }
}