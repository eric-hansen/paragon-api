const requester = require('request');
const config = require('./config.json');

/**
 * Formats a URL for the API call.  Really right now this is only called twice, but best to have
 * the same logic in one place versus duplicated in many areas.
 *
 * @param apiVersion
 * @param uri
 * @returns {string}
 */
function createUrl(apiVersion, uri)
{
    return config['base-uri']+'/v'+apiVersion+'/'+uri;
}

/**
 * Make an API call to Epic Games' services and returns it to the callback.
 * The callback must except the parameters this in order: error, body
 *
 * @param httpMethod
 * @param apiVersion
 * @param uri
 * @param authenticationHeader
 * @param callback
 * @param requestBody
 */
function makeRequest(httpMethod, apiVersion, uri, authenticationHeader, callback, requestBody) {
    var headers = {
        'X-Epic-ApiKey': config['key']
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

    console.log('API CALL TO EPIC GAMES:');
    console.dir(options);

    requester(options, function(error, response, body) {
        // Every response is JSON, so parse the string data as such now
        if (body) body = JSON.parse(body);

        console.log('API RESPONSE:');
        console.dir(body);

        callback(error, response, body);
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
 * @param callback
 */
function accountFind(displayName, platform, token, callback) {
    if ((!displayName && !platform) || (!displayName && platform)) {
        callback({'error': 'Display name is required, platform is optional.'}, {});
    } else if (platform && (platform != 'EPIC' && platform != 'PSN')) {
        callback({'error': 'Platform must either be EPIC or PSN.'}, {});
    } else {
        var url = "accounts";
        if (platform) url += '/'+platform;

        url += '/'+displayName;

        makeRequest('GET', 1, url, {'Authorization': 'Bearer '+token}, callback);
    }
}

/**
 * Get some basic information about the user's account.
 *
 * @param accountId
 * @param token
 * @param callback
 */
function accountInformation(accountId, token, callback) {
    makeRequest('GET', 1, 'account/'+accountId, {'Authorization': 'Bearer '+token}, callback);
}

/**
 * Given a deck ID, delete it from the user's account.
 *
 * @param accountId
 * @param deckId
 * @param token
 * @param callback
 */
function accountDeleteDeck(accountId, deckId, token, callback) {
    makeRequest('DELETE', 1, 'account/'+accountId+'/deck/'+deckId, {'Authorization': 'Bearer '+token}, callback);
}

/**
 * Get a deck from the account.  This provides some deep-level information about the deck.
 *
 * @param accountId
 * @param deckId
 * @param token
 * @param callback
 */
function accountGetDeck(accountId, deckId, token, callback) {
    makeRequest('GET', 1, 'account/'+accountId+'/deck/'+deckId, {'Authorization': 'Bearer '+token}, callback);
}

/**
 * Save the deck to Epic Games' servers.  deckSpec needs to match what Epic Games is looking for (see their API page for this).
 *
 * @param accountId
 * @param deckId
 * @param deckSpec
 * @param token
 * @param callback
 */
function accountSaveDeck(accountId, deckId, deckSpec, token, callback) {
    makeRequest('PUT', 1, 'account/'+accountId+'/deck/'+deckId, {'Authorization': 'Bearer '+token}, callback, deckSpec);
}

/**
 * Get some stats of the account (such as wins/losses, tower take downs, etc...).  As of this writing I only ever
 * get full 0's for these stats.
 *
 * @param accountId
 * @param token
 * @param callback
 */
function accountStats(accountId, token, callback) {
    makeRequest('GET', 1, 'account/'+accountId+'/stats', {'Authorization': 'Bearer '+token}, callback);
}

/**
 * Get all the decks associated with this user.
 *
 * The problem with this call is that it will also return decks that were deleted, but will only return their IDs.
 * So, we filter those out for sanity.
 *
 * @param accountId
 * @param token
 * @param callback
 */
function accountGetDecks(accountId, token, callback) {
    function internalCallback(error, body) {
        if (error) return callback(error, body);

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
        for (var decks = body.length; decks >= 0; decks--) {
            if (body[decks].hasOwnProperty('name') == false || typeof body[decks] == 'undefined') {
                body.splice(decks, 1);
            }
        }

        callback(error, body);
    }

    makeRequest('GET', 1, 'account/'+accountId+'/decks', {'Authorization': 'Bearer '+token}, internalCallback);
}

/**
 * Get all the cards that the account owns.  This is a better way to help build a deck, no?
 *
 * @param accountId
 * @param token
 * @param callback
 */
function accountGetOwnedCards(accountId, token, callback) {
    makeRequest('GET', 1, 'account/'+accountId+'/cards', {'Authorization': 'Bearer '+token}, callback);
}

/**
 * For a description of this see cardsGet description.  Just this pertains to heroes/players instead of cards.
 *
 * @param id
 * @param completeData
 * @param callback
 */
function heroesGet(id, completeData, callback) {
    var url = 'heroes';

    if (id) url = 'hero/'+id;
    if (completeData) url = 'heroes/complete';

    makeRequest('GET', 1, url, false, callback);
}

/**
 * Get a specific card, or all data of the cards.  If neither `id` or `completeData` is non-falsey then just return
 * some basic/general data of all the cards.  completeData will return extensive data such as maxed effects, cost, etc...
 *
 * If `id` and `completeData` are non-falsey then it defaults to getting the extensive data.
 *
 * @param id
 * @param completeData
 * @param callback
 */
function cardsGet(id, completeData, callback) {
    var url = 'cards';

    if (id) url = 'card/'+id;
    if (completeData) url = 'cards/complete';

    makeRequest('GET', 1, url, false, callback);
}

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
 * @param callback
 */
function authToken(code, callback) {
    var b64 = new Buffer(config['client-id']+':'+config['client-secret']);

    makeRequest('GET', 1, 'auth/token/'+code, {
                'Authorization': 'Basic '+b64.toString('base64')
            }, function(error, response, body) {
        callback(error, body);
    });
}

/**
 * "response_type" is needed or else the end user will see a confusing error message.  We could force a redirect
 * through here, but that shouldn't be the responsibility of an agnostic API wrapper.  So, just return the URL
 * through the body parameter and call it a day.
 *
 * @param callback
 */
function authLogin(callback) {
    callback({}, {'url': createUrl(1, 'auth/login/'+config['client-id']+'?response_type=code')});
}

module.exports = {
    authLogin
    , authToken
    , cardsGet
    , heroesGet
    , accountGetOwnedCards
    , accountGetDecks
    , accountStats
    , accountSaveDeck
    , accountGetDeck
    , accountDeleteDeck
    , accountInformation
    , accountFind
}