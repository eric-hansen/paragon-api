var should = require('should');
var describe = require('mocha').describe;
var it = require('mocha').it;
var config = {
    "key": "paragon-api-key",
    "client-id": "the client id",
    "client-secret": "secret of the client",
    "base-uri": "https://developer-paragon.epicgames.com"
};
var sinon = require('sinon');
var client = require('../../client')(config);

describe('Paragon API Node Client', function () {

    let makeRequestFunc = null;

    beforeEach(function () {
        makeRequestFunc = sinon.stub(client, 'makeRequest');
    });

    afterEach(function () {
        makeRequestFunc.restore();
    });

    describe('Login URL', function () {

        describe('Success', function () {
            it('should return client ID', function () {

                return client.authLogin().then(function (urlData) {

                    // urlData.should.be.an('object');
                    urlData.should.have.property('url');
                    urlData.url.should.equal('https://developer-paragon.epicgames.com/v1/auth/login/the client id?response_type=code');
                });
            });
        });

        describe('Failure', function () {
            before(function() {
                let badConfig = config;
                delete badConfig['client-id'];

                client = require('../../client')(badConfig);
            });

            after(function() {
                client = require('../../client')(config);
            });

            it('should throw an error on missing client ID', function (done) {

                client.authLogin().catch(function (error) {

                    error.should.not.be.empty;
                    error.should.equal('Config is missing "client-id" key.');

                    done();
                });
            });
        });
    });

    describe('deckFilter:', function() {

        describe('Success:', function () {

            it('should return one proper deck when another deck is invalid', function (done) {
                let result = client.deckFilter([{undefined},{name: "Some deck"}]);

                result.should.not.be.empty();
                (result.hasOwnProperty('name') === true).should.be.true;
                result[0].name.should.equal('Some deck');
                done();
            });

            it('should return 2 proper decks when 2 decks are invalid', function (done) {
                let result = client.deckFilter([
                    {undefined},
                    {name: 'Some deck'},
                    {undefined},
                    {name: 'Another deck'}
                ]);

                result.should.not.be.empty();
                result.length.should.equal(2);
                result[0].name.should.equal('Some deck');
                result[1].name.should.equal('Another deck');

                done();
            });
        });

        describe('Failure:', function () {
            
            it('should return an empty array when deck has no "name" attribute', function (done) {
                let result = client.deckFilter([{someData: "blah"}]);

                result.should.be.empty();
                done();
            });

            it('should return an empty array when deck is undefined', function (done) {
                (client.deckFilter([{undefined}])).should.be.empty();
                done();
            });
        });
    });
});