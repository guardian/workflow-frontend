define(['angular'], function (angular) {

    'use strict';

    var $ = angular.element,
        $composerNewContent = $('link[rel="composer-newcontent"]'),
        $composerViewContent = $('link[rel="composer-viewcontent"]'),
        $composerContentDetails = $('link[rel="composer-contentdetails"]'),
        $presenceUrl = $('link[rel="presence-url"]');

    var mod = angular.module('workflow.config', []);

    mod.constant(
      'config',
      {
        'composerNewContent': $composerNewContent.attr('href'),
        'composerViewContent': $composerViewContent.attr('href'),
        'composerContentDetails': $composerContentDetails.attr('href'),
        'presenceUrl': $presenceUrl.attr('href'),
        'maxNoteLength': 500
      }
    );

    mod.constant({ 'statuses': _wfConfig.statuses.data });
    mod.constant({ 'sections': _wfConfig.sections.data });

    return mod;
});
