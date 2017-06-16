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
            console.log(scope, element, attrs);
            scope.toggleSection = (sectionName) => {
                scope.openSection = sectionName
                console.log(scope.openSection);
            }
            transclude(scope, function(clone, scope) {
                
            });
        }
    }
}
