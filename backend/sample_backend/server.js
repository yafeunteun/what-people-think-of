'use strict';

const express = require('express');
const moment  = require('moment');
const twitter = require('twitter');
const Promise = require('promise');

// Constants
const PORT = 5000;


// twitter auth
var config = {
  consumer_key: 'OjAzkahPASwai41V9lr6VyVSd',
  consumer_secret: '1mxscunVopsL84rrgT8i6u07Q9MTYngUFuZv24iMJOOlKPyUf5',
  access_token_key: '2915847196-xclPchSaEmR9qCixUCTTrHRHWl1d6obDR83ZnQk',
  access_token_secret: 'l3YkCtl3vxvBO8MhPrkWYV48Z4UBZpTIogVbCCK2VUsCO'
};



// App
const app = express();

// set static files location
// used for requests that our frontend will make
app.use(express.static(__dirname + "/public"));


// MAIN CATCHALL ROUTE -------
// SEND USERS TO FRONTEND ------
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});



/**
 * Promise wrapper for Twitter search API
 * @param {Object} params - API parameters
 * @return {Promise}
 */
function searchTweets(params) {
  return new Promise(function(fulfill, reject) {
    var client = new twitter(config);
    client.get('search/tweets', params, function(err, tweets, _) {
      if (err) reject(err);
      else fulfill(tweets);
    });
  });
}

/**
 * Array flatMap extension
 * https://gist.github.com/samgiles/762ee337dff48623e729
 */
Array.prototype.flatMap = function(lambda) { 
  return Array.prototype.concat.apply([], this.map(lambda)); 
};

// Routes

/**
 * GET /twitter
 * @param {string} q - The query string
 * @return TODO
 */
app.get('/twitter', function(req, res) {
  var query = req.param('q')

  // NOTE: The API seems to returns the last tweets just before the `until` date,
  // so we don't have to specify `since_id` to prevent duplicated tweets,
  // this may be a problem if there is less than 100 tweets per day though.
  //
  // Retrieve tweets from today to 8 days since today.
  var promises = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function(i) {
    var date = moment().subtract(i, 'days').format('YYYY-MM-DD');
    return searchTweets({q: query, until: date, lang: 'en'})
  });

  Promise.all(promises).then(function(values) {
    var tweets = values.flatMap(function(v) { return v.statuses });
    res.send(tweets);
  });
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
