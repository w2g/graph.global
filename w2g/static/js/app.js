var Entity;
(function () {
  'use strict'; 

  var apiurl = "https://graph.global/v1";

  Entity = function(id) {
    this.id = id;    
  };
  Entity.all = function(callback) {
    var url = apiurl + '/entities';
    $.get(url, function(results) {
    }).done(function(data) {
      if (callback) { callback(data); }
    });
  };
  Entity.prototype = {
    get: function(callback) {
      var url = apiurl + '/entities/' + this.id;
      $.get(url, function(results) {
      }).done(function(data) {
	if (callback) { callback(data); }
      });
    }
  };

  var debounce = function (func, threshold, execAsap) {
    var timeout;
    return function debounced () {
      var obj = this, args = arguments;
      function delayed () {
        if (!execAsap)
          func.apply(obj, args);
        timeout = null;
      };
      
      if (timeout) {
        clearTimeout(timeout);
      } else if (execAsap) {
        func.apply(obj, args);
      }
      timeout = setTimeout(delayed, threshold || 100);
    };
  };

}());
