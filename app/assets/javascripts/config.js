define(['angular'], function (angular) {

    'use strict';

    var elem = document.getElementById('require-script');
    var composerNewContent = elem.getAttribute('data-composer-newcontent');
    var composerViewContent = elem.getAttribute('data-composer-viewcontent');

    var mod = angular.module('workflow.config', []);

    mod.constant('config', {'composerNewContent': composerNewContent,
                            'composerViewContent': composerViewContent
                });

    return mod;

});
