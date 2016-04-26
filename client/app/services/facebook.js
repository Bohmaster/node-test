'use strict';

var app = angular.module('facebook-login');

app.factory('FBService', function ($q) {

  return {

    getMyLastName: function () {

      var deferred = $q.defer();

      FB.api('/me', {
        fields: 'last_name'
      }, function (response) {
        if (!response || response.error) {
          deferred.reject('Error occured');
        } else {
          deferred.resolve(response);
        }
      });

      return deferred.promise;

    }

  }

});
