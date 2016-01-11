var Entity;
(function () {
  'use strict'; 

  var apiurl = "https://graph.global/v1";

  Entity = {
    all: function(callback) {
      var url = apiurl + '/entities';
      $.get(url, function(results) {
      }).done(function(data) {
        if (callback) { callback(data); }
      });
    },
    search: function(query, callback) {
      var url = apiurl + '/entities?action=search&field=name&query=' + query;
      $.get(url, function(results) {
      }).done(function(data) {
        if (callback) { callback(data); }
      });
    },
    get: function(id, callback) {
      var url = apiurl + '/entities/' + id;
      $.get(url, function(results) {
      }).done(function(data) {
        if (callback) { callback(data); }
      });
    },
    create: function(data, callback) {
      var url = apiurl + '/entities';
      $.post(url, data, function(results) {
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
