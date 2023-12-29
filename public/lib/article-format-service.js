define(['angular'], function (angular) {
    'use strict';

    var articleFormatService = angular.module('articleFormatService', []);

    articleFormatService.factory('articleFormatService',
        [function () {

            function getArticleFormats() {
                return [
                    {name: 'Standard Article', value: 'Standard Article'},
                    {name: 'Key takeaways', value: 'Key takeaways'},
                ]
            };

            return {
                getArticleFormats: getArticleFormats
            };

        }]);

    return articleFormatService;
});
