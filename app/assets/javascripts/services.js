define(['angular'], function (angular) {

    'use strict';

    var mod = angular.module('workflow.services', []);

    mod.value('version', '0.1');

    var registeredFilters = {};

    mod.value('filterParams', {
        register: function (filters) {
            for (var key in filters) {
                registeredFilters[key] = filters[key];
            }
        },
        get: function() { return registeredFilters; }
    });

    return mod;

});
