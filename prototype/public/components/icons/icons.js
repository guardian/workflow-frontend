
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
            wfIconActive: '=' // boolean
        },
        link: function($scope, $element) {

            var iconElem = document.createElementNS(SVG_NS, 'svg');
            iconElem.setAttribute('viewBox', '0 0 128 128');

            var useElem = iconElem.appendChild(document.createElementNS(SVG_NS, 'use'));

            $element.append(iconElem);

            function updateIconClass() {
                iconElem.setAttribute('class', [
                    'wf-icon--' + ($scope.wfIconActive !== false ? 'active' : 'inactive'),
                    'wf-icon-type--' + $scope.wfIcon
                ].join(' '));
            }

            $scope.$watch('wfIconActive', updateIconClass);

            $scope.$watch('wfIcon', (newValue, oldValue) => {
                useElem.setAttributeNS(XLINK_NS, 'href', '#icon-' + newValue);
                updateIconClass();
            });

        }
    };

}
