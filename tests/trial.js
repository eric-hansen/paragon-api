var should = require('should');
var describe = require('mocha').describe;
var it = require('mocha').it;
const config = require('../config.json');
var client = require('../client')(config);

describe('Paragon API Node Client', function () {

    describe('Login URL', function () {

        it('should return client ID', function () {

            return client.authLogin().then(function(urlData) {

               // urlData.should.be.an('object');
                urlData.should.have.property('url');
                urlData.url.should.equal('https://developer-paragon.epicgames.com/v1/auth/login/the client id?response_type=code');
            });
        });

        it('should throw an error on missing client ID', function (done) {

            client.authLogin().catch(function(error) {

                error.should.not.be.empty;
                error.should.equal('Config is missing "client-id" key.');

                done();
            })
        })
    });
});