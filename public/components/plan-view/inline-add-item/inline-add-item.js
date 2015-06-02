function wfInlineAddItem ($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/inline-add-item/inline-add-item.html',
        scope: {
            onSubmit: '&wfInlineAddItemOnSubmit'
        },
        controller: ($scope) => {
            $scope.display = false;
            $scope.newItem = {
                title: ''
            };
        },
        link: ($scope, elem, attrs) => {

            $scope.displayForm = () => {
                $scope.display = true;
                $timeout(() => { // angular...
                    elem[0].querySelector('.inline-add-item__input').focus();
                });
            };

            $scope.cancel = () => {
                $scope.display = false;
                $scope.newItem.title = '';
            };

            $scope.submit = () => {
                $scope.onSubmit({
                    title: $scope.newItem.title
                });
                $timeout(() => {
                    $scope.newItem.title = '';
                });
            }
        }
    }
}

export { wfInlineAddItem };
