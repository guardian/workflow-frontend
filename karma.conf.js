// Karma configuration
// Generated on Wed Aug 06 2014 15:34:15 GMT+0000 (UTC)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: 'public/',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon'],

    plugins: [
      require("karma-webpack"),
      require("karma-mocha"),
      require("karma-chai"),
      require("karma-sinon"),
      require("karma-phantomjs-launcher"),
    ],
    

    // list of files / patterns to load in the browser
    files: [
      '../node_modules/angular/angular.js',
      '../node_modules/angular-mocks/angular-mocks.js',
      'karma.bootstrap.js',
      '**/*.spec.js',
      { pattern: 'components/**/*.js', watched: true, included: false, served: true },
      { pattern: 'lib/**/*.js', watched: true, included: false, served: true },
      { pattern: '**/*.*', watched: false, included: false, served: true }
    ],

    proxies: {
      '/assets/': '/base/'
    },


    // list of files to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // add webpack as preprocessor
      '**/*.spec.js': ['webpack']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
