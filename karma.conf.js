// Karma configuration
// Generated on Wed Aug 06 2014 15:34:15 GMT+0000 (UTC)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: 'public/',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['systemjs', 'mocha', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/dist/system.js',
      'config.js',
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
    exclude: [
      'jspm_packages/**/*.spec.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    systemjs: {
        // Path to your SystemJS configuration file 
        configFile: 'system.conf.js',
    
        // Patterns for files that you want Karma to make available, but not loaded until a module requests them. eg. Third-party libraries. 
        serveFiles: [
            '*.js'
        ],
    
        // SystemJS configuration specifically for tests, added after your config file. 
        // Good for adding test libraries and mock modules 
        config: {
            paths: {
                'angular-mocks': 'bower_components/angular-mocks/angular-mocks.js'
            }
        }
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
