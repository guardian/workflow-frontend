/**
 * Karma bootstrap.
 *
 * Loads in angular-mocks via System.js (jspm) before tests load to ensure
 * Mocking libs are available globally for all test specs.
 */

before(function (done) {
    System.import('angular-mocks')

        .then(function () {
            console.log('Bootstrapped Angular mocks');

            done();

        }).catch(done);

});
