var path = require('path');

var loopback = require('loopback');
var boot     = require('loopback-boot');
var app      = module.exports = loopback();

var loopbackPassport     = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

var bodyParser = require('body-parser');

var flash = require('express-flash');

var config = {};
try {
  config = require('../providers.json');
} catch (err) {
  console.trace(err);
  process.exit(1);
}


boot(app, __dirname);

app.middleware('parse', bodyParser.json());
app.middleware('parse', bodyParser.urlencoded({
  extended: true
}));

app.middleware('auth', loopback.token({
  model: app.models.accessToken
}));

app.middleware('session:before', loopback.cookieParser('secret'));
app.middleware('session', loopback.session({
  secret           : 'kitty',
  saveUninitialized: true,
  resave           : true
}));

passportConfigurator.init();

app.use(flash());

passportConfigurator.setupModels({

  userModel          : app.models.user,
  userIdentityModel  : app.models.userIdentity,
  userCredentialModel: app.models.userCredential

});

for (var s in config) {

  var c     = config[s];
  c.session = c.session !== false;
  passportConfigurator.configureProvider(s, c);

}

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

app.get('/auth/account', ensureLoggedIn('/#/home'), function (req, res, next) {

  console.log(req.user);

  res.cookie('access-token', req.signedCookies['access_token']);
  res.cookie('userId', req.user.id);

  res.redirect('/#/app/loggedIn');

});

app.get('/auth/logout', function (req, res, next) {

  req.logout();
  res.redirect('/#/home');

});

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
