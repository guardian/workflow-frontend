define(['angular'], function (angular) {
    'use strict';

    var articleFormatService = angular.module('articleFormatService', []);

    articleFormatService.factory('articleFormatService',
        [function () {

            function getArticleFormats() {
                return [
                    {name: 'Standard Article', value: 'Standard Article'},
                    {name: 'Key Takeaways', value: 'Key Takeaways'},
                ]
            };

            return {
                getArticleFormats: getArticleFormats
            };

        }]);

    return articleFormatService;
});
