var wfContentListDraw = function ($rootScope) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: '/assets/components/content-list-draw/content-list-draw.html',
        link: function ($scope, elem, attrs) {

            var transitionEndEvents = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd',
                hiddenClass = 'content-list-draw--hidden';

            function show (contentItemView, contentListItemElement, contentList) {
                contentListItemElement.after(elem);
                setTimeout(function () { // wait for reflow
                    $scope.contentItemView = contentItemView;
                    contentList.selectedItem = contentItemView;
                    $scope.$apply();
                    elem.removeClass(hiddenClass);
                }, 1);
            }

            $scope.hide = function () {
                elem.one(transitionEndEvents, function () {
                    $scope.contentList.selectedItem = null;
                    $scope.$apply();
                });
                elem.addClass(hiddenClass);
            };

            $rootScope.$on('contentItem.select', ($event, contentItemView, contentListItemElement, contentList) => {

                $scope.contentList = contentList;

                if (contentList.selectedItem !== contentItemView) { // open
                    if (!elem.hasClass(hiddenClass)) {
                        elem.addClass(hiddenClass);
                        elem.one(transitionEndEvents, function () {
                            show(contentItemView, contentListItemElement, contentList);
                        });
                    } else {
                        show(contentItemView, contentListItemElement, contentList);
                    }
                } else { // close
                    $scope.hide(contentList);
                }

            });
        }
    };
};

export {wfContentListDraw}
