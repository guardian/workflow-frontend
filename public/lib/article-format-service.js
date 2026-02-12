import angular from 'angular';
import { provideArticleFormatsForDropDown } from './model/format-helpers.ts';


angular.module('articleFormatService', [])
    .factory('articleFormatService', ['wfPreferencesService', function (wfPreferencesService) {
        function getArticleFormats() {
            const featureSwitches = wfPreferencesService.preferences?.featureSwitches;
            return provideArticleFormatsForDropDown(featureSwitches)
        };
        return {
            getArticleFormats: getArticleFormats
        };
    }]);
