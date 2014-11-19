/**
 * Icon directive that inserts SVG elements which reuse paths from a single
 * SVG sprite injected into the bottom of the document head.
 *
 * Usage:
 *     <i wf-icon="example" />
 *
 * Appends SVG:
 *     <svg class="wf-icon--active wf-icon-type--example" viewBox="0 0 128 128">
 *         <use xlink:href="#icon-article"></use>
 *     </svg>
 *
 * Icon Sprite file:
 *     <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
 *         <defs>
 *             <g id="icon-arrow-down">
 *                 <path d="..." />
 *             </g>
 *         </defs>
 *     </svg>
 */


import angular from 'angular';

// Path to aggregated icons
var ICON_FILE = '/assets/components/icons/icons.svg';

// SVG Namespace
var SVG_NS = 'http://www.w3.org/2000/svg';
var XLINK_NS = 'http://www.w3.org/1999/xlink';


angular.module('wfIcons', [])
    .run(['$http', wfIconInit])
    .directive('wfIcon', wfIconDirective);


// Async loads the icon sprite file
function wfIconInit($http) {
    $http({
        method: 'GET',
        url: ICON_FILE,
        responseType: 'text'
    })

    .then((response) => {

        if (response.data && response.data.indexOf('<svg') !== 0) {
            throw new Error('Unexpected response for icon sprite: ' + response.data);
        }

        angular.element(document.head).append(response.data);

    })

    .catch((err) => {
        throw new Error([
            'Could not load icon sprite: ',
            err.status || '?',
            err.statusText || 'Unknown',
            'from',
            err.config && err.config.method || '',
            err.config && err.config.url || ''

        ].join(' '));
    });
}


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
