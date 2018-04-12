var express = require('express');
var app = express();

var session = require('express-session');
var bodyParser = require('body-parser');
var uuid = require('uuid/v1');
var mongoose = require('mongoose');
//var bcrypt = require('bcrypt-nodejs');
var assert = require('assert');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/gamesdb');
                 //,{useMongoClient: true});

// middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// configure view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// configure sessions
app.use(session({
  genid: function(request) {
    return uuid();
  },
  resave: false,
  saveUninitialized: false,
  //cookie: {secure: true},
  secret: 'apollo slackware prepositional expectations'
}));

// database schema
var Schema = mongoose.Schema;

var gamesListScheme = new Schema({
  gameTitle: String,
  genre: String,
  price: Number,
  rating: Number,
}, {collection: 'gamesList'});
var GamesList = mongoose.model('gamesList', gamesListScheme);

var usersGamesSchema = new Schema({
  gameTitle: String,
  genre: String,
  price: Number,
  rating: Number,
}, {collection: 'usersGames'});
var UsersGames = mongoose.model('usersGames', usersGamesSchema);

//Loads total list of games on the main page
function loadGameList(request, response, errorMessage) {
  GamesList.find().then(function(results) {
    console.log(results);
    response.render('App', {title: 'Game Search',
                                 message: 'Select the games youre interested in',
                                 games: results,
                                 errorMessage: errorMessage});
  });
}

//Loads the users wishlist
function loadUserGameList(request, response, errorMessage) {
  UsersGames.find().then(function(results) {
    console.log(results);
    response.render('Wishlist', {title: 'Wishlist',
                                 message: 'This is your wishlist',
                                 games: results});
  });
}

//Default page
app.get('/', function(request, response) {
  var session = request.session;
  response.redirect('/gameSearch');
});

//Games Search Page
app.get('/gameSearch', function(request, response) {
  loadGameList(request, response, '');
});

//Adds a game to Wishlist
app.post('/addgame', function(request, response) {
  var title = request.body.gameTitle;
  var genre = request.body.genre;
  var price = request.body.price;
  var rating = parseFloat(request.body.rating);
  console.log(title)
  console.log(genre)
  console.log(price)
  console.log(rating)

  var gamesData = {gameTitle: title,
                     genre: genre,
                     price: price,
                     rating: rating};

  UsersGames.find({gameTitle: title}).then(function(results) {
    if (results.length > 0) {
      console.log(results)
      UsersGames.update({gameTitle: title},
                     gamesData,
                     {multi: false},
                     function(error, numAffected) {
        if (error || numAffected != 1) {
          console.log('Unable to update user game list');
        } else {
          console.log('Users game list Updated');
        }
      });
    } else {
      var newGame = new UsersGames(gamesData);
      newGame.save(function(error) {
        if (error) {
          console.log('Unable to save game to list');
        } else {
          console.log('Users game list Updated');
        }
      });
    }
  });
});

//Removes Game from Wishlist
app.post('/deleteGame', function(request, response) {
  var title = request.body.gameTitle;
  UsersGames.remove({gameTitle: title}, function(error) {
    if (error) {
      console.log('error deleting game from user list');
    } else {
        console.log('Deleted ',title,' game from user list');
    }
  });
  loadUserGameList(request, response, ' ')
});

//Loads Wishlist page
app.get('/Wishlist', function(request, response) {
  loadUserGameList(request, response, ' ')
});

//Filters games by genre
app.post('/filterGames', function(request, response) {
  var genre = request.body.genre;
  console.log(genre)
  GamesList.find({genre: genre}).then(function(results) {
    console.log(results)
    if (genre != 'all'){
      response.render('App', {title: 'Game Search',
                                 message: 'Filtered Games by ' + genre + ' genre',
                                 games: results});
    }else{
      response.redirect('/gameSearch');
    }
  });
});

app.listen(3001, function() {
  console.log('Listening on port 3001');
});
