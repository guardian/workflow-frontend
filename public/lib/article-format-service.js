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
                    {name: 'Timeline', value: 'Timeline'},
                    {name: 'Mini profiles', value: 'Mini profiles'},
                ]
                if (featureSwitches && featureSwitches.multiByline){
                    articleFormats.push({name: 'Multi-byline', value: 'Multi-byline'})
                }
                return articleFormats                    
            };
        return {
                getArticleFormats: getArticleFormats
            };
        }]);
    return articleFormatService;
});
