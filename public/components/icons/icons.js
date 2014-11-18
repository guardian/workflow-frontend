
import angular from 'angular';

// Path to aggregated icons
var ICON_FILE = 'components/icons/icons.svg';

// SVG Namespace
var SVG_NS = 'http://www.w3.org/2000/svg';
var XLINK_NS = 'http://www.w3.org/1999/xlink';


angular.module('wfIcons', [])
    .run(wfIconInit)
    .directive('wfIcon', wfIconDirective);


// Async loads the icon file
function wfIconInit() {
    System.import(ICON_FILE + '!text').then((iconSprite) => {
        angular.element(document.head).append(iconSprite);

    }, (err) => { window.onerror(err); });
}


function wfIconDirective() {

    return {
        restrict: 'A',
        scope: {
            wfIcon: '@',
            wfIconActive: '=', // boolean
            wfIconDark: '=' //boolean
        },
        link: function($scope, $element) {

            var iconElem = document.createElementNS(SVG_NS, 'svg');
            // iconElem.setAttribute('class', 'wf-icon');
            iconElem.setAttribute('viewBox', '0 0 128 128');

            var useElem = iconElem.appendChild(document.createElementNS(SVG_NS, 'use'));
            useElem.setAttributeNS(XLINK_NS, 'href', '#icon-' + $scope.wfIcon);


            $element.append(iconElem);

            $scope.$watch('wfIconActive', (newValue, oldValue) => {
                iconElem.setAttribute('class', 'wf-icon--' + (newValue !== false ? 'active' : 'inactive'));
            });

            // $scope.iconUrl = () => {
            //     var postFixOptions = [
            //         $scope.wfIconActive !== false ? 'active' : 'inactive',
            //         $scope.wfIconDark === true ? 'dark-bg' : ''
            //     ];

            //     var urlPostfix = postFixOptions.map(function(postFixOption) {
            //         return postFixOption == '' ? '' : '-' + postFixOption;
            //     }).reduce(function(previous, current, i, a) {
            //         return previous + current;
            //     });

            //     return ICON_DIR + ICON_FILE + '#' + $scope.wfIcon + urlPostfix;
            // };
        }
    };

}
