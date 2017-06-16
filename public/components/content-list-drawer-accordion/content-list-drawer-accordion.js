export function wfContentListDrawerAccordion ($rootScope) {
    return {
        restrict: 'A',
        transclude: true,
        replace: true,
        template: '<ng-transclude></ng-transclude>',
        scope: {
            openSection: '=wfOpenSection',
        },
        link: (scope, element, attrs, ctrl, transclude) => {
            scope.toggleSection = (sectionName) => {
                scope.openSection = sectionName
            }
            transclude(scope, function(clone, scope) {
                
            });
        }
    }
}
