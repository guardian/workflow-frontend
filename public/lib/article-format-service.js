define(['angular'], function (angular) {
    'use strict';

    var articleFormatService = angular.module('articleFormatService', []);

    articleFormatService.factory('articleFormatService',['wfPreferencesService', function (wfPreferencesService) {
            function getArticleFormats() {
                const featureSwitches = wfPreferencesService.preferences.featureSwitches;

                const articleFormats =  [
                    {name: 'Standard Article', value: 'Standard Article'},
                    {name: 'Key Takeaways', value: 'Key Takeaways'},
                    {name: 'Q&A Explainer', value: 'Q&A Explainer'},
                ]
                if (featureSwitches && featureSwitches.timeline){
                    articleFormats.push({name: 'Timeline', value: 'Timeline'})
                }
                if (featureSwitches && featureSwitches.miniProfiles){
                    articleFormats.push({name: 'Mini profiles', value: 'Mini profiles'})
                }
                return articleFormats                    
            };
        return {
                getArticleFormats: getArticleFormats
            };
        }]);
    return articleFormatService;
});
