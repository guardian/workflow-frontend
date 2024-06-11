define(['angular'], function (angular) {
    'use strict';

    var articleFormatService = angular.module('articleFormatService', []);

    articleFormatService.factory('articleFormatService',[function () {
            function getArticleFormats() {
                return [
                    {name: 'Standard Article', value: 'Standard Article'},
                    {name: 'Key Takeaways', value: 'Key Takeaways'},
                    {name: 'Q&A Explainer', value: 'Q&A Explainer'},
                    {name: 'Timeline', value: 'Timeline'},
                    {name: 'Mini Profiles', value: 'Mini Profiles'},
                ]
            };
        return {
                getArticleFormats: getArticleFormats
            };
        }]);
    return articleFormatService;
});
