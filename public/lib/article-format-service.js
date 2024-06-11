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
                    {name: 'Mini Profile', value: 'Mini Profile'},
                ]
            };
        return {
                getArticleFormats: getArticleFormats
            };
        }]);
    return articleFormatService;
});
