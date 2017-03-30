# paragon-api

A Node.js API client for the web API of [Paragon](https://www.epicgames.com/paragon/en-US/news), a game by [EPIC Games](https://www.epicgames.com).

## How To Use

1.  Email paragon-api-key-request@epicgames.com and request an API key
2.  Run `npm install --save paragon-api`
3.  Copy config.json.sample or create a config.json (see [config.json.sample](config.json.sample))
4.  Add `const paragonApiClient = require('paragon-api')(require('config.json'));`
5.  Make API calls

## Supported Endpoints

This client supports all documented API endpoints as of 2016-10-05.

## Callback Format

Callbacks are no longer supported and follow the paradigm of Promises.

## Returned Data

On success, you will receive an object of the data (because I'm that nice).  On error, the response will be an object of the error response that the API server provided.

## How To Authenticate

1.  Make a call to authLogin
2.  This will return an `url` property in the 2nd parameter of the URL to redirect the user to
3.  The user will be redirected, and on success or failure the callback you give to EPIC Games on sign up
4.  You will be passed back a "code" in the URI (GET) and optionally an "error" if the user cancelled the request

## Getting Decks

This is a special case in where once-used-but-not-anymore deck slots will still have an ID but no other attributes.  So, the API client will loop through each deck retrieved and filter out the ones that are not valid anymore.

## TODO

- [x] Make this use promise-style logic instead
- [ ] Support more endpoints when the API is updated
- [ ] Add in some extra features??
- [ ] Write tests
- [ ] Implement mocking for API calls to Paragon services (yes, for tests, but a reminder to do it would be nice)