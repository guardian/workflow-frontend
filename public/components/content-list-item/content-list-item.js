/**
 * Directive allowing the contentListItems to interact with the details drawer
 * @param $rootScope
 */
var wfContentListItem = function ($rootScope) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: '/assets/components/content-list-item/content-list-item.html',
        scope: {
            contentItem: '=',
            contentList: '=',
            legalValues: '=',
            statusValues: '='
        },
        link: function ($scope, elem, attrs) {

            /**
             * Emit an event telling the details drawer to move itself to this element, update and display.
             * @param {Object} contentItem - this contentItem
             */
            $scope.selectItem = (contentItem) => {

                $rootScope.$emit('contentItem.select', contentItem, elem);
            };

        }
    };
};

export { wfContentListItem }
