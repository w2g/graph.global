
var mod;
var Entity, Source, RemoteId, Edge, Resource, requests;
(function () {
  'use strict'; 

  $.support.cors = true
  var apiurl = "https://graph.global/v1";

  requests = {
    get: function(url, callback) {
      $.get(url, function(results) {
      }).done(function(data) {
        if (callback) { callback(data); }
      });
    },

    post: function(url, data, callback) {
      $.post(url, data, function(results) {
      }).done(function(data) {
        if (callback) { callback(data); }
      });
    },

    put: function(url, data, callback) {
      $.put(url, data, function(results) {
      }).done(function(data) {
        if (callback) { callback(data); }
      });
    },
  };

  Resource = {
    create: function(data, callback) {
      var url = apiurl + '/resources';
      requests.post(url, data, callback);
    },
    update: function(resource_id, data, callback) {
      var url = apiurl + '/resources/' + resource_id;
    }
  }
    
  Source = {
    all: function(callback) {
      var url = apiurl + '/sources';
      requests.get(url, callback);
    }
  };

  Edge = {
    all: function(callback) {
      requests.get(apiurl + '/edges?verbose=1', function(edges) {
        callback(edges);
      });
    },
    create: function(source_eid, relation_eid, target_eid, callback) {
      // should deal with ids / names which don't (yet) exist
      requests.post(apiurl + '/edges', {
        source_eid: source_eid,
        relation_eid: relation_eid,
        target_eid: target_eid
      }, function(edge) {
        console.log(edge);
        callback(edge);
        /*
        if(context_id) {
          requests.post(apiurl + '/contexts', {
            entity_id: source_id,
            edge_id: edge.id
          }, function(context) {
            console.log(context);
          });
          }
        */
      });
    },
    delete: function(id, callback) {
      var url = apiurl + '/edges/' + id + '/delete';
      requests.get(url, callback);
    }
  }

  RemoteId = {
    create: function(data, callback) {
      var url = apiurl + '/entities_to_sources';
      requests.post(url, data, callback);
    },

    update: function(id, data, callback) {
      var url = apiurl + '/entities_to_sources/' + id;
      requests.put(url, data, callback);
    }
  }

  Entity = {
    all: function(callback) {
      var url = apiurl + '/entities';
      requests.get(url, callback);
    },

    search: function(query, callback) {
      var url = apiurl + '/entities?action=search&field=name&query=' + query + '&limit=15';
      requests.get(url, callback);
    },

    get: function(id, callback) {
      var url = apiurl + '/entities/' + id;
      requests.get(url, callback);
    },

    create: function(data, callback) {
      var url = apiurl + '/entities';
      requests.post(url, data, callback);
    },

    update: function(id, data, callback) {
      var url = apiurl + '/entities/' + id;
      requests.put(url, data, callback);
    },

    leaderboard: function(callback) {
      var url = apiurl + '/entities?action=leaderboard';
      requests.get(url, callback);
    },

    associate_resource: function(id, resource_id, callback) {
      var url = apiurl + '/entities/' + id + '/resources';
      requests.post(url, {resource_id: resource_id}, callback);
    },

    resources: function(id, callback) {
      var url = apiurl + '/entities/' + id + '/resources';
      requests.get(url, callback);
    },

    /* Returns {edges: {parents: [], children: []}} */
    edges: function(id, callback) {
      var url = apiurl + '/entities/' + id + '/edges';
      requests.get(url, callback);
    },

    delete: function(id, callback) {
      var url = apiurl + '/entities/' + id + '/delete';
      requests.get(url, callback);
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

  mod = function(n, m) {
    return(((n % m) + m) % m);
  }

}());
