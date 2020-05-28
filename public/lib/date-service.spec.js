import './date-service';

describe('lib/date-service', function () {

    beforeEach(function () {
        angular.mock.module('wfDateService');
    });


    describe('wfDateParser.parseDate()', function () {
        it('should parse text inputs relative to timezone when in LON', function () {

            angular.mock.inject(function (wfDateParser) {

                // 6am on 14 August 2025 in London local time (BST +0100)
                var parsed = wfDateParser.parseDate('14-08-2025 6:00', 'LON');
                expect(parsed).to.be.an.instanceof(Date);
                expect(parsed.toISOString()).to.eql('2025-08-14T05:00:00.000Z');
            });
        });


        it('should parse text inputs relative to timezone when in NYC', function () {

            angular.mock.inject(function (wfDateParser) {

                // 6am on 14 August 2025 in New York local time (EDT -0400)
                var parsed = wfDateParser.parseDate('08-14-2025 6:00', 'NYC');

                expect(parsed).to.be.an.instanceof(Date);
                expect(parsed.toISOString()).to.eql('2025-08-14T10:00:00.000Z');
            });
        });


        it('should parse text inputs relative to timezone when in SYD', function () {

            angular.mock.inject(function (wfDateParser) {

                // 6am on 14 August 2025 in Sydney local time (EST +1000)
                var parsed = wfDateParser.parseDate('14-08-2025 6am', 'SYD');

                expect(parsed).to.be.an.instanceof(Date);
                expect(parsed.toISOString()).to.eql('2025-08-13T20:00:00.000Z');
            });
        });

    });

    // integration tests to parse a date range
    describe('wfDateParser.parseRangeFromString()', function () {

        it('should parse range for today in LON', function () {

            angular.mock.inject(function (wfDateParser) {

                sinon.stub(wfDateParser, 'now').returns(new Date('2025-10-07T06:48:32Z'));

                var parsed = wfDateParser.parseRangeFromString('today', 'LON');

                expect(parsed).not.to.be.null;
                expect(parsed.from).to.be.an.instanceof(Date);
                expect(parsed.until).to.be.an.instanceof(Date);

                // 2025-10-11 is BST +0100
                expect(parsed.from.toISOString()).to.eql('2025-10-06T23:00:00.000Z');
                expect(parsed.until.toISOString()).to.eql('2025-10-07T23:00:00.000Z');
            });

        });


        it('should parse range for tomorrow in LON', function () {

            angular.mock.inject(function (wfDateParser) {

                sinon.stub(wfDateParser, 'now').returns(new Date('2025-10-07T06:48:32Z'));

                var parsed = wfDateParser.parseRangeFromString('tomorrow', 'LON');

                expect(parsed).not.to.be.null;
                expect(parsed.from).to.be.an.instanceof(Date);
                expect(parsed.until).to.be.an.instanceof(Date);

                // 2025-10-11 is BST +0100
                expect(parsed.from.toISOString()).to.eql('2025-10-07T23:00:00.000Z');
                expect(parsed.until.toISOString()).to.eql('2025-10-08T23:00:00.000Z');
            });

        });


        it('should parse range for the weekend in LON', function () {

            angular.mock.inject(function (wfDateParser) {

                sinon.stub(wfDateParser, 'now').returns(new Date('2025-10-07T06:48:32Z'));

                var parsed = wfDateParser.parseRangeFromString('weekend', 'LON');

                expect(parsed).not.to.be.null;
                expect(parsed.from).to.be.an.instanceof(Date);
                expect(parsed.until).to.be.an.instanceof(Date);
                console.log(parsed)
                console.log(JSON.stringify(parsed))
                // 2025-10-11 is BST +0100
                expect(parsed.from.toISOString()).to.eql('2025-10-10T23:00:00.000Z');
                expect(parsed.until.toISOString()).to.eql('2025-10-12T23:00:00.000Z');
            });

        });


        it('should parse range for tomorrow in NYC', function () {

            angular.mock.inject(function (wfDateParser) {

                sinon.stub(wfDateParser, 'now').returns(new Date('2025-10-07T06:48:32Z'));

                var parsed = wfDateParser.parseRangeFromString('tomorrow', 'NYC');

                expect(parsed).not.to.be.null;
                expect(parsed.from).to.be.an.instanceof(Date);
                expect(parsed.until).to.be.an.instanceof(Date);

                // 2025-10-11 is EDT -0400
                expect(parsed.from.toISOString()).to.eql('2025-10-08T04:00:00.000Z');
                expect(parsed.until.toISOString()).to.eql('2025-10-09T04:00:00.000Z');
            });

        });


        it('should parse range for tomorrow in SYD', function () {

            angular.mock.inject(function (wfDateParser) {

                sinon.stub(wfDateParser, 'now').returns(new Date('2025-10-07T06:48:32Z'));

                var parsed = wfDateParser.parseRangeFromString('tomorrow', 'SYD');

                expect(parsed).not.to.be.null;
                expect(parsed.from).to.be.an.instanceof(Date);
                expect(parsed.until).to.be.an.instanceof(Date);

                // 2025-10-11 is +1100
                expect(parsed.from.toISOString()).to.eql('2025-10-07T13:00:00.000Z');
                expect(parsed.until.toISOString()).to.eql('2025-10-08T13:00:00.000Z');
            });

        });


        it('should parse day range for specified date in SYD', function () {

            angular.mock.inject(function (wfDateParser) {

                var parsed = wfDateParser.parseRangeFromString('2025-08-14', 'SYD');

                expect(parsed).not.to.be.null;
                expect(parsed.from).to.be.an.instanceof(Date);
                expect(parsed.until).to.be.an.instanceof(Date);

                // 2025-08-14 is +1000
                expect(parsed.from.toISOString()).to.eql('2025-08-13T14:00:00.000Z');
                expect(parsed.until.toISOString()).to.eql('2025-08-14T14:00:00.000Z');
            });

        });

    });
});
