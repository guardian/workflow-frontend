System.config({
  "baseURL": '/assets',

  "paths": {
    "*": "*.js",
    "npm:*": "jspm_packages/npm/*.js",
    "github:*": "jspm_packages/github/*.js"
  }
});

System.config({
  "map": {
    "github:components/bootstrap": "github:components/bootstrap@^3.1.1",
    "angular": "github:angular/bower-angular@^1.2.18",

    // main app mapping:
    "app": "javascripts/app",

    // old unmanaged packages
    "angularRoute": "javascripts/components/angular-route",
    "bootstrapJs": "javascripts/components/bootstrap",
    "moment": "javascripts/components/moment.min",
    "sugar": "javascripts/components/sugar.min",
    "ui.bootstrap.datetimepicker": "javascripts/components/datetimepicker",
    "uiBootstrap": "javascripts/components/ui-bootstrap-tpls-0.11.0.min",
    "underscore": "javascripts/components/underscore-min",
    "xeditable": "javascripts/components/xeditable.min"
  }
});

System.config({
  "versions": {
    "github:components/bootstrap": "3.1.1",
    "github:angular/bower-angular": "1.2.18"
  }
});

// Required for angular
System.meta['github:angular/bower-angular@1.2.18/angular.min'] = {
  format: 'global',
  exports: 'angular'
};
