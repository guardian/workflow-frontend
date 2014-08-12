# Workflow Public static assets


## Package management
Uses [jspm](http://jspm.io) for client-side external dependencies.

The `../setup.sh` script will install jspm locally via `npm` and then use
jspm to install all client-side dependencies in the `jspm_packages` directory.

[System.js](https://github.com/systemjs/systemjs) is used for client-side
module loading. Its a universal module loader, enabling loading of ES6 modules,
AMD, CommonJS and global scripts.

[`config.js`](config.js) configures System.js by mapping package names to the
packages installed with `jspm`.

The [jspm-cli](https://github.com/jspm/jspm-cli) tool can be used for
including new dependencies, or upgrading packages.

## Javascript unit tests
- Tests written in [mocha](http://visionmedia.github.io/mocha/)
- [chai](http://chaijs.com/) for assertions
- [sinon](http://sinonjs.org/) for stubs/mocks
- [angular-mock](https://code.angularjs.org/1.2.20/docs/api/ngMock) for mocking angular dependencies
- Test runner using [Karma](http://karma-runner.github.io/)

To run tests:

    cd /home/workflow/prototype
    npm install
    npm test

> Note: Currently having issues when running with phantomjs, but works well in Chrome.
> When the runner has started, visit http://localhost:9876/ in a browser to attach it as a test runner.
