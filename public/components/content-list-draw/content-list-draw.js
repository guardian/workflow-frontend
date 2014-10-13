var wfContentListDraw = function ($rootScope, config, contentService, prodOfficeService) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: '/assets/components/content-list-draw/content-list-draw.html',
        scope: {
            contentList: '=',
            legalValues: '=',
            statusValues: '='
        },
        link: function ($scope, elem, attrs) {

            var transitionEndEvents = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd',
                hiddenClass = 'content-list-draw--hidden';

            $scope.prodOffices = prodOfficeService.getProdOffices();

            function show (contentItem, contentListItemElement) {
                contentListItemElement.after(elem);
                setTimeout(function () { // wait for reflow
                    $scope.contentItem = contentItem;
                    $scope.contentList.selectedItem = contentItem;
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

            $rootScope.$on('contentItem.select', ($event, contentItem, contentListItemElement) => {

                console.log(contentItem);

                if ($scope.contentList.selectedItem !== contentItem) { // open
                    if (!elem.hasClass(hiddenClass)) {
                        elem.addClass(hiddenClass);
                        elem.one(transitionEndEvents, function () {
                            show(contentItem, contentListItemElement);
                        });
                    } else {
                        show(contentItem, contentListItemElement);
                    }
                } else { // close
                    $scope.hide();
                }

            });

            // Update functions

            $scope.updateNote = function (note) {
                if (note.length > config.maxNoteLength) return "Note too long";
                contentService.updateField($scope.contentItem, "note", note)
                    .then($scope.apply, errorMessage);
            };

            $scope.updateOffice = function (office) {
                contentService.updateField($scope.contentItem, "prodOffice", office)
                    .then($scope.apply, errorMessage);
            };

            $scope.updateDeadline = function () {

                var content = $scope.contentItem,
                    parsedDate,
                    requestData;

                if (content.deadline) { // TODO: See content-list.js:118
                    parsedDate = moment(content.deadline);
                    if (parsedDate.isValid()) {
                        requestData = parsedDate.toISOString();
                    }
                }

                contentService.updateField($scope.contentItem, "dueDate", requestData)
                    .then($scope.apply, errorMessage);
            };

            $scope.updateAssignee = function (assignee) {
                contentService.updateField($scope.contentItem, "assignee", assignee)
                    .then($scope.apply, errorMessage);
            };

            $scope.deleteContentItem = function () {
                contentService.remove($scope.contentItem.id)
                    .then($scope.apply, errorMessage);
            };

            function errorMessage () {
                // TODO: Generic error message
            }

        }
    };
};

export {wfContentListDraw}
