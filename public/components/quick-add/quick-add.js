import angular from 'angular';
import _ from 'lodash';

var quickAddParsers = [
    (item, text) => {
        return text.replace(/article|gallery/i, (match) => {
            item.contentType = match.toLowerCase();
            return match;          // delete the matched text? return "" here if so
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

angular.module('wfQuickAdd', ['wfContentService'])
    .directive('wfQuickAdd', ['wfContentService', '$rootScope', function (wfContent, $rootScope) {
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
                $scope.defaultProps = {
                    newsList: "testNewsList"
                };

                $scope.submit = function () {
                    var parsed = parseQuickAdd($scope.addText);
                    var content = _.defaults(parsed, $scope.defaultProps);
                    $rootScope.$broadcast("quick-add-submit", content);
                }

                $scope.$on('wf-quick-add-activate', function () {
                    $scope.active = true;
                });
                $scope.$on('wf-quick-add-deactivate', function () {
                    $scope.active = false;
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
