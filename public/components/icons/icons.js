/**
 * Icon directive that inserts SVG elements which reuse paths from a single
 * SVG sprite injected into the bottom of the document head.
 *
 * Usage:
 *     <i wf-icon="example" />
 *
 * Appends SVG:
 *     <svg class="wf-icon--active wf-icon-type--example" viewBox="0 0 128 128">
 *         <use xlink:href="#icon-example"></use>
 *     </svg>
 *
 * Icon Sprite file:
 *     <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
 *         <defs>
 *             <g id="example">
 *                 <path d="..." />
 *             </g>
 *         </defs>
 *     </svg>
 */


import angular from 'angular';

// Aggregation icons
import icons from 'components/icons/icons.svg!text';

// SVG Namespace
var SVG_NS = 'http://www.w3.org/2000/svg';
var XLINK_NS = 'http://www.w3.org/1999/xlink';

// inject icons into <head>
angular.element(document.head).append(icons);

angular.module('wfIcons', [])
    .directive('wfIcon', wfIconDirective);

function wfIconDirective() {

    return {
        restrict: 'A',
        scope: {
            wfIcon: '@',
            wfIconActive: '=' // boolean
        },
        link: function($scope, $element) {

            // Create the icon element
            //   Needs to be created this way with explicit Namespace as Angular
            //   template creates HTML nodes rather than SVG.
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
