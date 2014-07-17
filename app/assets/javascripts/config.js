define(['angular'], function (angular) {

    'use strict';

    var $ = angular.element,
        $composerNewContent = $('link[rel="composer-newcontent"]'),
        $composerViewContent = $('link[rel="composer-viewcontent"]'),
        $composerContentDetails = $('link[rel="composer-contentdetails"]');

    var mod = angular.module('workflow.config', []);

    mod.constant(
      'config',
      {
        'composerNewContent': $composerNewContent.attr('href'),
        'composerViewContent': $composerViewContent.attr('href'),
        'composerContentDetails': $composerContentDetails.attr('href'),
        'maxNoteLength': 500
      }
    );

    mod.constant({ 'statuses': _wfConfig.statuses.data });

    return mod;
});
