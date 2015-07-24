function wfDropZones ($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/drop-zones/drop-zones.html',
        transclude: true,
        scope: {
            location: '=dropZonesLocation'
        },
        controller: ($scope) => {
            $scope.droppable = {
                hoverClass: 'dz--hover',
                drop: onDropZoneDrop
            };

            function onDropZoneDrop (event, ui) {
                var droppedOnScope = angular.element(event.target).scope();
                $scope.$emit('drop-zones-drop--' + $scope.location, droppedOnScope);
            }

        },
        link: ($scope, elem, attrs) => {

            let dropZonesContainer = elem[0].querySelector('.drop-zones__container');

            $scope.$on('drop-zones-show', () => {
                dropZonesContainer.classList.add('drop-zones__container--show');
            });

            $scope.$on('drop-zones-hide', () => {
                dropZonesContainer.classList.remove('drop-zones__container--show');
            });

            function setUpDroppables () {
                $(elem[0].querySelectorAll('.droppable')).droppable($scope.droppable);
            }

            $timeout(setUpDroppables);

        }
    }
}

export { wfDropZones };
