import angular from 'angular';
import { FeatureSwitchService } from "./feature-switches/featureSwitchService.ts"


angular.module('wfFeatureSwitchService', [])
    .factory('wfFeatureSwitchService', [
        'wfPreferencesService',
        function (
            wfPreferencesService
        ) {            
            const service = new FeatureSwitchService(
                () => wfPreferencesService.getOptionalPreference('featureSwitches')
            );
            service.init();
            return service;
        }
    ])
