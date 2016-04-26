'use strict';

var app = angular.module('facebook-login', [

  'ngCookies',
  'ngResource',
  'ui.router',
  'lbServices',
  'facebook'

]);

app.controller('MainController', function ($rootScope, $state, $scope, $window, $cookies, User, LoopBackAuth) {

  $scope.logout = function () {

    User.logout()
      .$promise
      .then(function (success) {

        //clearListCookies();

        LoopBackAuth.clearUser();
        LoopBackAuth.clearStorage();
        LoopBackAuth.save();

        $window.localStorage.removeItem('currentUser');
        $window.localStorage.removeItem('fb_access_token');

        $window.location = '/auth/logout';

      })
      .catch(function (err) {
        console.log(err);
      });

  };

});

app.controller('HomeController', function ($rootScope, $scope, $window, $cookies, LoopBackAuth, User, Facebook, $state, $stateParams) {

  console.log($stateParams);

  if ($stateParams.freshLogin) {

    // console.log('freshLogin');
    $window.location.reload();

  }

  if (!$rootScope.currentUser) {

    // console.log('not logged in');

    var userId        = $cookies.get('userId');
    var accessTokenId = $cookies.get('access-token');

    LoopBackAuth.currentUserId = userId;
    LoopBackAuth.accessTokenId = accessTokenId;
    LoopBackAuth.save();

    User.getCurrent(function (user) {

      // console.log(user);
      $rootScope.currentUser = user;

      Facebook.getLoginStatus(function (response) {

        // console.log(response);

        if (response.status == "connected") {

          var fb_access_token = response.authResponse.accessToken;
          $window.localStorage.setItem('fb_access_token', fb_access_token);

          Facebook.api('/me' + '?access_token=' + fb_access_token, function (response) {

            console.log('Response from facebook API: ', response);

            var url = "/" + response.id + "/picture";

            Facebook.api(url, function (res) {

              if (res && !res.error) {

                // console.log(res);

                $scope.$apply(function () {

                  $rootScope.currentUser.name   = response.name;
                  $rootScope.currentUser.avatar = res.data.url;

                  // console.log($rootScope.currentUser);

                });

                $window.localStorage.setItem('currentUser', JSON.stringify($rootScope.currentUser));

              }

            });

          });

        }

      });

    });

  } else {

    console.log('Authenticated');

  }

});

app.controller('ProfileController', function ($rootScope, $scope, $window, $state, $cookies, LoopBackAuth, User, Facebook) {

  console.log('Running');

  $scope.me = "";

  Facebook.api('/me' + '?access_token=' + $window.localStorage.getItem('fb_access_token'), function (response) {

    console.log('Response from facebook API: ', response);

    $scope.$apply(function () {

      $scope.me = response;

    });

  });

});

app.config(function ($stateProvider, $urlRouterProvider, FacebookProvider) {

  var FB_API_KEY = '961269550603353';

  $urlRouterProvider.otherwise('/app');

  $stateProvider
    .state('app', {
      abstract   : true,
      templateUrl: 'app/views/base.html',
      url        : '/app',
      controller : 'MainController'
    })
    .state('app.home', {
      url        : '',
      templateUrl: 'app/views/home.html',
      controller : 'HomeController',
      params     : {
        freshLogin: false
      },
      data       : {
        protected: false
      }
    })
    .state('app.profile', {
      url        : '/profile',
      templateUrl: 'app/views/profile.html',
      controller : 'ProfileController',
      data       : {
        protected: true
      }
    })
    .state('app.loggedIn', {
      url       : '/loggedIn',
      template  : '<h1>Loggin in...</h1>',
      controller: function ($rootScope, $location, $timeout, $state) {

        $timeout(function () {

          $state.go('app.home', {

            freshLogin: true

          });

        }, 2000);

      }

    });

  FacebookProvider.init(FB_API_KEY);

});

app.run(function ($rootScope, $window, $state) {

  $rootScope.$on('$stateChangeStart', function (event, toState) {

    // console.log('state changed', toState);

    if (!$rootScope.currentUser && toState.data.protected) {

      event.preventDefault();

      window.alert('You need to be authenticated');
      $state.go('app.home');

    }

    var user = JSON.parse(localStorage.getItem('currentUser'));

    if (user) {

      $rootScope.currentUser = user;

    }

  });

});

app.directive('facebookLogin', function () {

  return {
    restrict   : 'EA',
    templateUrl: 'app/elements/fb-login.html',
    controller : function ($rootScope, $scope, $window) {

      $scope.login = function () {

        $window.location = '/auth/facebook';

      }

    }
  }

});
