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

All callbacks need to be passed in such as:

```javascript
function callback(error, responseBody) {
    if (error) handleError(error);

    doSomethingWithJSONResponseBody(responseBody);
}
```

where both `error` and `responseBody` will be JSON objects based on API documentation.  Read: the client calls JSON.parse() on both properties prior to passing them to the callback.

## How To Authenticate

1.  Make a call to authLogin
2.  This will return an `url` property in the 2nd parameter of the URL to redirect the user to
3.  The user will be redirected, and on success or failure the callback you give to EPIC Games on sign up
4.  You will be passed back a "code" in the URI (GET) and optionally an "error" if the user cancelled the request

## Getting Decks

This is a special case in where once-used-but-not-anymore deck slots will still have an ID but no other attributes.  So, the API client will loop through each deck retrieved and filter out the ones that are not valid anymore.

## TODO

1.  Make this use promise-style logic instead
2.  Support more endpoints when the API is updated
3.  Add in some extra features??