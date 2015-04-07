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
                var filterParams = wfFiltersService.getAll();
                console.log(filterParams);
                $scope.currentNewsListId = filterParams['news-list'].toString();
//                $scope.currentNewsListId = selectedNewsListId;


                $scope.defaultProps = function() {
                    return {
                        id: 0,// Should not need to be here!
                        newsList: $scope.currentNewsListId,
                        plannedDate: new Date().toISOString().slice(0, 10).replace(/-/g, '-') // yyyy-MM-dd
                    }
                };
                $scope.submit = function () {

                    var parsed = parseQuickAdd($scope.addText);
                    var content = _.defaults(parsed, $scope.defaultProps());
                    $rootScope.$broadcast("quick-add-submit", content);
                };

                $scope.$on('wf-quick-add-activate', function () {
                    $scope.disabled = false;
                });
                $scope.$on('wf-quick-add-deactivate', function () {
                    $scope.disabled = true;
                });

                $scope.$on('pvFiltersChanged', function() {
                    var filters = wfFiltersService.getAll();
                    $scope.currentNewsListId = filters['news-list'] ? filters['news-list'].toString() : null; // TODO: toString should not be necessary!
                });

                // If no news list has been selected ('All news') then disable the quick-add form
                $scope.$watch('currentNewsListId', function() {
                    $scope.disabled = $scope.currentNewsListId ? false : true;
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
