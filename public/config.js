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
    "angular": "github:angular/bower-angular@1.2.20",
    "angular-bootstrap": "npm:angular-bootstrap@^0.11.0",
    "angular-bootstrap-datetimepicker": "github:dalelotts/angular-bootstrap-datetimepicker@0.2.4",
    "angular-route": "github:components/angular-route@^1.2.0",
    "angular-xeditable": "github:vitalets/angular-xeditable@0.1.8",
    "bootstrap": "github:components/bootstrap@3.2.0",
    "jquery": "github:components/jquery@1.11.1",
    "moment": "github:moment/moment@^2.8.1",
    "sugar": "npm:sugar@^1.4.1",
    "underscore": "github:jashkenas/underscore@^1.6.0",
    "npm:angular-bootstrap@0.11.0": {},
    "npm:sugar@1.4.1": {},
    "github:jspm/nodelibs@0.0.2": {
      "base64-js": "npm:base64-js@^0.0.4",
      "inherits": "npm:inherits@^2.0.1",
      "ieee754": "npm:ieee754@^1.1.1",
      "Base64": "npm:Base64@0.2",
      "json": "github:systemjs/plugin-json@master"
    },
    "npm:inherits@2.0.1": {},
    "npm:base64-js@0.0.4": {},
    "npm:Base64@0.2.1": {},
    "npm:ieee754@1.1.3": {},
    "css": "github:systemjs/plugin-css@^0.1.0",
    "moment-timezone": "github:moment/moment-timezone@^0.2.1",
    "json": "github:systemjs/plugin-json@master",
    "angular-mocks": "github:angular/bower-angular-mocks@^1.2.7",
    "mixpanel": "github:mixpanel/mixpanel-js@^2.2.2",
    "ua-parser": "github:faisalman/ua-parser-js@^0.7.0",
    "angular-animate": "github:angular/bower-angular-animate@^1.2.22",
    "angular-ui-router": "github:angular-ui/ui-router@^0.2.11"
  }
});

System.config({
  "versions": {
    "npm:angular-bootstrap": "0.11.0",
    "github:dalelotts/angular-bootstrap-datetimepicker": "0.2.4",
    "github:components/bootstrap": "3.2.0",
    "github:components/angular-route": "1.2.0",
    "github:vitalets/angular-xeditable": "0.1.8",
    "github:jashkenas/underscore": "1.7.0",
    "npm:sugar": "1.4.1",
    "github:moment/moment": "2.8.3",
    "github:angular/bower-angular": "1.2.20",
    "github:jspm/nodelibs": "0.0.2",
    "npm:base64-js": "0.0.4",
    "npm:ieee754": "1.1.3",
    "npm:Base64": "0.2.1",
    "github:systemjs/plugin-json": "master",
    "npm:inherits": "2.0.1",
    "github:components/jquery": "1.11.1",
    "github:systemjs/plugin-css": "0.1.0",
    "github:moment/moment-timezone": "0.2.2",
    "github:angular/bower-angular-mocks": "1.2.25",
    "github:mixpanel/mixpanel-js": "2.2.3",
    "github:faisalman/ua-parser-js": "0.7.0",
    "github:angular/bower-angular-animate": "1.2.25",
    "github:angular-ui/ui-router": "0.2.11"
  }
});

