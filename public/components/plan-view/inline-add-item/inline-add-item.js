function wfInlineAddItem ($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/inline-add-item/inline-add-item.html',
        scope: {
            onSubmit: '&wfInlineAddItemOnSubmit'
        },
        controller: ($scope) => {
            $scope.display = false;
        },
        link: ($scope, elem, attrs) => {

            $scope.displayForm = () => {
                $scope.display = true;
                $timeout(() => { // angular...
                    elem[0].querySelector('.inline-add-item__input').focus();
                });
            };

            $scope.onBlur = () => {
                $scope.display = false;
            };

            $scope.submit = (title) => {

                $scope.onSubmit({
                    title: title
                });
                $scope.title = null;
                $scope.display = false;
            }
        }
    }
}

export { wfInlineAddItem };
