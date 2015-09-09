
import angular from 'angular';

import 'components/stub-modal/stub-modal';

import './dashboard.html!ng-template';

angular.module('wfDashboard', ['wfStubModal'])
    .controller('wfDashboardController', [wfDashboardController]);


function wfDashboardController() {

}
