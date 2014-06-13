define(['angular'], function (angular) {

    'use strict';

    var elem = document.getElementById('require-script');
    var composerNewContent = elem.getAttribute('data-composer-newcontent');
    var composerViewContent = elem.getAttribute('data-composer-viewcontent');
    var statuses = elem.getAttribute('data-statuses');

    var mod = angular.module('workflow.config', []);

    mod.constant('config', {'composerNewContent': composerNewContent,
                            'composerViewContent': composerViewContent
                });

    mod.constant({'statuses': JSON.parse(statuses).data})

    return mod;

});
