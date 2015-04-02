import angular from 'angular';
import _ from 'lodash';

var quickAddParsers = [
    (item, text) => {
        return text.replace(/article|gallery/i, (match) => {
            item.contentType = match.toLowerCase();
            return match;          // delete the matched text? return "" here if so
        });
    },
    (item, text) => {
        return text.replace(/(@|at )([0-9]+)/i, (match, at, hour) => {
            item.hour = Number(hour);
            return "";
        });
    },
    (item, text) => { item.title = text; return text; }
];

function parseQuickAdd(text) {
    return _.reduce(quickAddParsers, (data, parser) => {
        var newItem = _.clone(data.item);
        var newText = parser(newItem, data.text);
        return {item: newItem, text: newText};
    }, {item: {}, text: text}).item;
}

angular.module('wfQuickAdd', ['wfContentService', 'wfFiltersService'])
    .directive('wfQuickAdd', ['wfContentService', 'wfFiltersService', '$rootScope',  function (wfContent, wfFiltersService, $rootScope) {
       return {
            restrict: 'A',
            templateUrl: '/assets/components/quick-add/quick-add.html',
            scope: {
                customDefaultProps: '=',
                onAddHook: '='
            },
            link: function($scope, elm) {
                $scope.active = false;

                /* the default properties will be applied to the
                 * parsed object, to fill in any gaps */

                $scope.currentNewsListId = "1"; // <<<<<<<<<<<<<<<<<<<<<<<< TODO: Set to default newslist


                $scope.defaultProps = function() {
                    return {
                        id: 0,// Should not need to be here!
                        newsList: $scope.currentNewsListId
                    }
                };
                $scope.submit = function () {

                    var parsed = parseQuickAdd($scope.addText);
                    var content = _.defaults(parsed, $scope.defaultProps());
                    $rootScope.$broadcast("quick-add-submit", content);
                };

                $scope.$on('wf-quick-add-activate', function () {
                    $scope.active = true;
                });
                $scope.$on('wf-quick-add-deactivate', function () {
                    $scope.active = false;
                });

                $scope.$on('pvFiltersChanged', function(event, newsList) {
                    var filters = wfFiltersService.getAll();
                    console.log(filters['news-list']);
                    $scope.currentNewsListId = filters['news-list'] ? filters['news-list'].toString() : "1"; // TODO: toString should not be necessary! And we need a better default
                });
            }
        }
    }])
    .directive('wfQuickAddInput', ['$timeout', function ($timeout) {
        return {
            link: function($scope, elm) {
                // can't listen directly to the event here because
                // there is a race condition with the listener getting
                // activated before focus() is useable.
                $scope.$watch('active', function(newVal, oldVal) {
                    if(newVal != oldVal && newVal == true) elm[0].focus();
                });
            }
        }
    }]);
