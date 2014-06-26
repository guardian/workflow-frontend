System.config({
  "baseURL": "./assets",
  "paths": {
    "*": "*.js",
    "npm:*": "jspm_packages/npm/*.js",
    "github:*": "jspm_packages/github/*.js"
  }
});

System.config({
  "map": {
    "app": "javascripts/app",
    "uiBootstrap": "npm:angular-bootstrap@^0.11.0",
    "ui.bootstrap.datetimepicker": "github:dalelotts/angular-bootstrap-datetimepicker@^0.2.4",
    "bootstrapJs": "github:components/bootstrap@^3.1.1",
    "angularRoute": "github:components/angular-route@^1.2.0",
    "xeditable": "github:vitalets/angular-xeditable@^0.1.8",
    "underscore": "github:jashkenas/underscore@^1.6.0",
    "sugar": "npm:sugar@^1.4.1",
    "moment": "github:moment/moment@^2.7.0",
    "angular": "github:angular/bower-angular@1.2.1",
    "npm:angular-bootstrap@0.11.0": {},
    "npm:sugar@1.4.1": {},
    "github:jspm/nodelibs@0.0.2": {
      "base64-js": "npm:base64-js@^0.0.4",
      "ieee754": "npm:ieee754@^1.1.1",
      "Base64": "npm:Base64@0.2",
      "json": "github:systemjs/plugin-json@master",
      "inherits": "npm:inherits@^2.0.1"
    },
    "npm:base64-js@0.0.4": {},
    "npm:ieee754@1.1.3": {},
    "npm:Base64@0.2.1": {},
    "npm:inherits@2.0.1": {}
  }
});

System.config({
  "versions": {
    "npm:angular-bootstrap": "0.11.0",
    "github:dalelotts/angular-bootstrap-datetimepicker": "0.2.4",
    "github:components/bootstrap": "3.1.1",
    "github:components/angular-route": "1.2.0",
    "github:vitalets/angular-xeditable": "0.1.8",
    "github:jashkenas/underscore": "1.6.0",
    "npm:sugar": "1.4.1",
    "github:moment/moment": "2.7.0",
    "github:angular/bower-angular": "1.2.1",
    "github:jspm/nodelibs": "0.0.2",
    "npm:base64-js": "0.0.4",
    "npm:ieee754": "1.1.3",
    "npm:Base64": "0.2.1",
    "github:systemjs/plugin-json": "master",
    "npm:inherits": "2.0.1"
  }
});

