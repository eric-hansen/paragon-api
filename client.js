module.exports = function(config) {
    const requester = require('request');

    let _ = require('lodash');

    let functions = {};

    /**
     * Formats a URL for the API call.  Really right now this is only called twice, but best to have
     * the same logic in one place versus duplicated in many areas.
     *
     * @param apiVersion
     * @param uri
     * @returns {string}
     */
    function createUrl(apiVersion, uri) {
        return config['base-uri'] + '/v' + apiVersion + '/' + uri;
    }

    /**
     * Make an API call to Epic Games' services and returns it to the callback.
     * The callback must except the parameters this in order: error, body
     *
     * @param httpMethod
     * @param apiVersion
     * @param uri
     * @param authenticationHeader
     * @param requestBody
     */
    functions.makeRequest = function(httpMethod, apiVersion, uri, authenticationHeader, requestBody) {
        var headers = {
            'X-Epic-ApiKey': config.key
        };

        if (authenticationHeader) {
            for (var header in authenticationHeader) {
                headers[header] = authenticationHeader[header];
            }
        }

        var options = {
            url: createUrl(apiVersion, uri),
            headers: headers,
            method: httpMethod
        };

        if (requestBody) options = Object.assign(options, {'body': requestBody});

        return new Promise(function(resolve, reject) {
            requester(options, function (error, response, body) {
                // Every response is JSON, so parse the string data as such now
                if (body) resolve(JSON.parse(body));
                if (error) reject(JSON.parse(error));
            });
       });
    }

    /**
     * This is an odd little API call.  It lets you target down to the platform (EPIC of PSN) where you want to query for
     * an account's name.  This then will return the account ID of that user.
     *
     * Since you need to have a token for most of the account* API calls there's no harm in using this call, it is just
     * sort of different to drill down to a specific platform, at least to me.
     *
     * @param displayName
     * @param platform
     * @param token
     */
    functions.accountFind = function (displayName, platform, token) {
      return new Promise(function(success, error) {
        if ((!displayName && !platform) || (!displayName && platform)) {
            error('Display name is required, platform is optional.');
        } else if (platform && (platform !== 'EPIC' && platform !== 'PSN')) {
            error('Platform must either be EPIC or PSN.');
        } else {
            var url = "accounts";
            if (platform) url += '/' + platform;

            url += '/' + displayName;

            return module.exports.makeRequest(
                'GET',
                1,
                url,
                {'Authorization': 'Bearer ' + token}
            );
        }
      });
    };

    /**
     * Get some basic information about the user's account.
     *
     * @param accountId
     * @param token
     */
    functions.accountInformation = function(accountId, token) {
        return module.exports.makeRequest(
                'GET',
                1,
                'account/' + accountId,
                {'Authorization': 'Bearer ' + token}
        );
    };

    /**
     * Given a deck ID, delete it from the user's account.
     *
     * @param accountId
     * @param deckId
     * @param token
     */
    functions.accountDeleteDeck = function(accountId, deckId, token) {
        return module.exports.makeRequest(
                'DELETE',
                1,
                'account/' + accountId + '/deck/' + deckId,
                {'Authorization': 'Bearer ' + token}
        );
    };

    /**
     * Get a deck from the account.  This provides some deep-level information about the deck.
     *
     * @param accountId
     * @param deckId
     * @param token
     */
    functions.accountGetDeck = function(accountId, deckId, token) {
        return module.exports.makeRequest(
                'GET',
                1,
                'account/' + accountId + '/deck/' + deckId,
                {'Authorization': 'Bearer ' + token}
        );
    };

    /**
     * Save the deck to Epic Games' servers.  deckSpec needs to match what Epic Games is looking for (see their API page for this).
     *
     * @param accountId
     * @param deckId
     * @param deckSpec
     * @param token
     */
    functions.accountSaveDeck = function(accountId, deckId, deckSpec, token) {
        return module.exports.makeRequest(
                'PUT',
                1,
                'account/' + accountId + '/deck/' + deckId,
                {'Authorization': 'Bearer ' + token},
                deckSpec
        );
    };

    /**
     * Get some stats of the account (such as wins/losses, tower take downs, etc...).  As of this writing I only ever
     * get full 0's for these stats.
     *
     * @param accountId
     * @param token
     */
    functions.accountStats = function(accountId, token) {
        return module.exports.makeRequest(
                'GET',
                1,
                'account/' + accountId + '/stats',
                {'Authorization': 'Bearer ' + token}
        );
    };

    functions.deckFilter = function(deckData) {
        /**
         * This is an odd situation.  There might be a more optimal way of doing this, too, so it is more than welcome.
         *
         * Take, for example, you create a deck within the game.  Then you delete it.  While you can't actually ever
         * view the deck again (rightfully so), you still have a reference to what is basically an orphan deck at this
         * point.
         *
         * This for loop is meant to eliminate these types of decks, which is basically an object with only an "id"
         * property.  However, the way to confidently check this is to ensure either the name field doesn't exist or
         * that the typeof for the array entry is undefined (even though it's an object....  I don't understand).
         */
        return _.forEach(deckData, function (deck, index) {
            if (typeof deck === 'undefined' || deck.hasOwnProperty('name') === false) {
                deckData.splice(index, 1);
            }
        });
    };

    /**
     * Get all the decks associated with this user.
     *
     * The problem with this call is that it will also return decks that were deleted, but will only return their IDs.
     * So, we filter those out for sanity.
     *
     * @param accountId
     * @param token
     */
    functions.accountGetDecks = function(accountId, token) {
        return new Promise(function(success, error) {
            module.exports.makeRequest(
                'GET',
                1,
                'account/' + accountId + '/decks',
                {'Authorization': 'Bearer ' + token}
            ).then(function (responseBody) {
                success(module.exports.deckFilter(responseBody));
            }).catch(function (errorBody) {
                error(errorBody);
            });
        });
    };

    /**
     * Get all the cards that the account owns.  This is a better way to help build a deck, no?
     *
     * @param accountId
     * @param token
     */
    functions.accountGetOwnedCards = function(accountId, token) {
        return module.exports.makeRequest(
            'GET',
            1,
            'account/' + accountId + '/cards',
            {'Authorization': 'Bearer ' + token}
        );
    };

    /**
     * For a description of this see cardsGet description.  Just this pertains to heroes/players instead of cards.
     *
     * @param id
     * @param completeData
     */
    functions.heroesGet = function(id, completeData) {
        var url = 'heroes';

        if (id) url = 'hero/' + id;
        if (completeData) url = 'heroes/complete';

        return module.exports.makeRequest(
            'GET',
            1,
            url
        );
    };

    /**
     * Get a specific card, or all data of the cards.  If neither `id` or `completeData` is non-falsey then just return
     * some basic/general data of all the cards.  completeData will return extensive data such as maxed effects, cost, etc...
     *
     * If `id` and `completeData` are non-falsey then it defaults to getting the extensive data.
     *
     * @param id
     * @param completeData
     */
    functions.cardsGet = function(id, completeData) {
        var url = 'cards';

        if (id) url = 'card/' + id;
        if (completeData) url = 'cards/complete';

       return  module.exports.makeRequest(
           'GET',
           1,
           url
       );
    };

    /**
     * AUTHENTICATION FLOW
     *
     * 1.  User is sent to the link generated by authLogin
     * 2.  User submits their login credentials and accepts the OAuth link
     * 3.  User is redirected to the callback URL (provided on API registration to Epic Games) with &code=... passed back in URL
     * 4.  Call authToken(code_value, callback(...)) to complete the account link process
     */

    /**
     * @param code
     */
    functions.authToken = function(code) {
        var b64 = new Buffer(config['client-id'] + ':' + config['client-secret']);

        return module.exports.makeRequest(
            'GET',
            1,
            'auth/token/' + code,
            {'Authorization': 'Basic ' + b64.toString('base64')}
        );
    };

    /**
     * "response_type" is needed or else the end user will see a confusing error message.  We could force a redirect
     * through here, but that shouldn't be the responsibility of an agnostic API wrapper.  So, just return the URL
     * through the body parameter and call it a day.
     */
    functions.authLogin = function() {
        return new Promise(function(resolve, reject) {
            if (!config.hasOwnProperty('client-id')) reject('Config is missing "client-id" key.');
            else {
                resolve({
                    'url': createUrl(
                        1,
                        'auth/login/' + config['client-id'] + '?response_type=code')
                });
            }
        });
    };

    return functions;
};
