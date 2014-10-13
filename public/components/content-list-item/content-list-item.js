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

            $scope.selectItem = (contentItem) => {
                $rootScope.$emit('contentItem.select', contentItem, elem);
            };

//            attrs.$observe('contentItem', function(contentItem) {
//                $scope.contentItem = contentItem;
//            });

//            $scope.$on('contentItem.select', ($event, contentItemView) => {
//                $scope.contentItemView = contentItemView;
//
//                console.log($event, elem)
//
//            });

        }
    };
};

export { wfContentListItem }
