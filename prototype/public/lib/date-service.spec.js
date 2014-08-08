
describe('lib/date-service', function() {

  before(function(done) {

    System.import('lib/date-service')
      .then(function() {
        done();
      })
      .catch(done);

  });


  beforeEach(function() {
    angular.mock.module('wfDateService');
  });


  it('should parse text inputs relative to timezone when in LON', function() {

    angular.mock.inject(function(wfDateParser) {

      // 6am on 14 August 2014 in London local time (BST +0100)
      var parsed = wfDateParser.parseDate('14-08-2014 6:00', 'LON');

      expect(parsed).to.be.an.instanceof(Date);
      expect(parsed.toISOString()).to.eql('2014-08-14T05:00:00.000Z');
    });
  });


  it('should parse text inputs relative to timezone when in NYC', function() {

    angular.mock.inject(function(wfDateParser) {

      // 6am on 14 August 2014 in New York local time (EDT -0400)
      var parsed = wfDateParser.parseDate('08-14-2014 6:00', 'NYC');

      expect(parsed).to.be.an.instanceof(Date);
      expect(parsed.toISOString()).to.eql('2014-08-14T10:00:00.000Z');
    });
  });


  it('should parse text inputs relative to timezone when in SYD', function() {

    angular.mock.inject(function(wfDateParser) {

      // 6am on 14 August 2014 in Sydney local time (EST +1000)
      var parsed = wfDateParser.parseDate('14-08-2014 6am', 'SYD');

      expect(parsed).to.be.an.instanceof(Date);
      expect(parsed.toISOString()).to.eql('2014-08-13T20:00:00.000Z');
    });
  });
});
