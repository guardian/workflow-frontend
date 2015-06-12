function wfDropZones ($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/drop-zones/drop-zones.html',
        transclude: true,
        scope: {

        },
        controller: ($scope) => {
            $scope.droppable = {
                hoverClass: 'dz--hover',
                drop: onDropZoneDrop
            };

            function onDropZoneDrop (event, ui) {
                var droppedOnScope = angular.element(event.target).scope();
                $scope.$emit('drop-zones-drop', droppedOnScope);
            }

        },
        link: ($scope, elem, attrs) => {

            let dropZonesContainer = elem[0].querySelector('.drop-zones-container');

            $scope.$on('drop-zones-show', () => {
                dropZonesContainer.classList.add('drop-zones-container--show');
            });

            $scope.$on('drop-zones-hide', () => {
                dropZonesContainer.classList.remove('drop-zones-container--show');
            });

            function setUpDroppables () {
                $(elem[0].querySelectorAll('li')).droppable($scope.droppable);
            }

            $timeout(setUpDroppables);

        }
    }
}

export { wfDropZones };
