System.config({
  baseURL: "./assets",
  defaultJSExtensions: true,
  transpiler: "traceur",
  paths: {
    "github:*": "jspm_packages/github/*",
    "npm:*": "jspm_packages/npm/*"
  },

  map: {
    "angular": "github:angular/bower-angular@1.3.8",
    "angular-animate": "github:angular/bower-angular-animate@1.3.8",
    "angular-bootstrap": "npm:angular-bootstrap-temporary@0.11.0",
    "angular-bootstrap-datetimepicker": "github:dalelotts/angular-bootstrap-datetimepicker@0.2.4",
    "angular-mocks": "github:angular/bower-angular-mocks@1.3.8",
    "angular-ui-router": "github:angular-ui/ui-router@0.2.11",
    "bootstrap": "github:components/bootstrap@3.2.0",
    "css": "github:systemjs/plugin-css@0.1.0",
    "jquery": "github:components/jquery@1.11.1",
    "jquery-ui": "npm:jquery-ui@1.10.5",
    "json": "github:systemjs/plugin-json@0.1.0",
    "lodash": "npm:lodash@2.4.1",
    "mixpanel": "github:mixpanel/mixpanel-js@2.2.3",
    "moment": "github:moment/moment@2.8.3",
    "moment-timezone": "github:moment/moment-timezone@0.2.3",
    "ngInfiniteScroll": "github:sroze/ngInfiniteScroll@1.2.0",
    "node-uuid": "npm:uuid-v4.js@1.0.2",
    "raven-js": "github:getsentry/raven-js@1.1.16",
    "sugar": "npm:sugar@1.4.1",
    "text": "github:systemjs/plugin-text@0.0.2",
    "traceur": "github:jmcriffey/bower-traceur@0.0.91",
    "traceur-runtime": "github:jmcriffey/bower-traceur-runtime@0.0.91",
    "ua-parser": "github:faisalman/ua-parser-js@0.7.1",
    "underscore": "github:jashkenas/underscore@1.7.0",
    "github:angular/bower-angular-animate@1.3.8": {
      "angular": "github:angular/bower-angular@1.3.8"
    },
    "github:angular/bower-angular-mocks@1.3.8": {
      "angular": "github:angular/bower-angular@1.3.8"
    },
    "github:jspm/nodelibs-process@0.1.1": {
      "process": "npm:process@0.10.1"
    },
    "github:sroze/ngInfiniteScroll@1.2.0": {
      "angular": "github:angular/bower-angular@1.3.8"
    },
    "npm:jquery-ui@1.10.5": {
      "fs": "github:jspm/nodelibs-fs@0.1.2"
    },
    "npm:lodash@2.4.1": {
      "process": "github:jspm/nodelibs-process@0.1.1"
    },
    "npm:sugar@1.4.1": {
      "process": "github:jspm/nodelibs-process@0.1.1"
    }
  }
});
