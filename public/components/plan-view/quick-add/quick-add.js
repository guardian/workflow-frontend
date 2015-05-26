import angular from 'angular';
import _ from 'lodash';
import moment  from 'moment';

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

var QA_BUTTON_DEFAULT_TEXT = 'Add',
    QA_BUTTON_SUCCESS_TEXT = 'Success',
    QA_BUTTON_FAILURE_TEXT = 'Add failed';

angular.module('wfQuickAdd', ['wfContentService', 'wfFiltersService'])
    .directive('wfQuickAdd', ['wfContentService', 'wfFiltersService', '$rootScope', '$timeout',   function (wfContent, wfFiltersService, $rootScope, $timeout) {
       return {
            restrict: 'E',
            templateUrl: '/assets/components/plan-view/quick-add/quick-add.html',
            scope: {
                customDefaultProps: '=',
                onAddHook: '=',
                preSelectedDate: '='
            },
            link: function($scope, elm) {

                $scope.withDatePicker = $scope.preSelectedDate ? false : true;

                $scope.addDate = $scope.preSelectedDate;

                $scope.$watch('preSelectedDate', (date) => { $scope.addDate = date; });

                $scope.active = false;
                $scope.buttonText = 'Add';

                /* the default properties will be applied to the
                 * parsed object, to fill in any gaps */
                var filterParams = wfFiltersService.getAll();

                $scope.currentNewsListId = filterParams['news-list'] ? filterParams['news-list'] : null;


                $scope.defaultProps = function(addDate) {

                    let ISO_8601 = 'YYYY-MM-DD';

                    // if date not set, use default of this time tomorrow <<<< TODO: Think about this - maybe date field should be compulsory
                    if (!addDate) {
                        addDate = moment(moment()).add(1, 'days');
                    }
                    return {
                        id: 0,// Should not need to be here!
                        newsList: $scope.currentNewsListId,
                        plannedDate: moment(addDate).format(ISO_8601)
                    }
                };

                $scope.clearFields = function() {
                    $scope.addText = null;
                    $scope.addDate = $scope.preSelectedDate;
                    $rootScope.$broadcast('resetPicker');
                };

                $scope.submit = function () {
                    var parsed = parseQuickAdd($scope.addText);
                    var content = _.defaults(parsed, $scope.defaultProps($scope.addDate));
                    $rootScope.$broadcast('plan-view__quick-add-submit', content);
                };

                $rootScope.$on('quick-add-success', function () {
                    $scope.showSuccess = true;
                    $scope.buttonText = QA_BUTTON_SUCCESS_TEXT;
//                    $scope.disabled = true;
                    $scope.clearFields();
                    $timeout(function() { $scope.showSuccess = false; $scope.buttonText = QA_BUTTON_DEFAULT_TEXT; }, 1000);
                });

                $rootScope.$on('quick-add-failure', function () {
                    $scope.showFailure = true;
//                    $scope.disabled = true;
                    $scope.buttonText = QA_BUTTON_FAILURE_TEXT;
                    $timeout(function() { $scope.showFailure = false; $scope.buttonText = QA_BUTTON_DEFAULT_TEXT;}, 1000);
                });

                $scope.$on('wf-quick-add-activate', function () {
                    $scope.disabled = false;
                    $scope.active = true;
                });

                $scope.$on('wf-quick-add-deactivate', function () {
                    $scope.disabled = true;
                    $scope.active = false;
                });

                $scope.$on('plan-view__filters-changed', function() {
                    var filters = wfFiltersService.getAll();
                    $scope.currentNewsListId = filters['news-list'] ? filters['news-list'] : null;
                });

                // If no news list has been selected ('All news') then disable the quick-add form
                $scope.$watch('currentNewsListId', function() {
                    $scope.disabled = $scope.currentNewsListId ? false : true;
                });

                $scope.$watch('addText', function() {
                    $scope.addButtonDisabled = !$scope.addText || $scope.addText.length === 0;
                })
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
