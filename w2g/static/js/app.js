var redux, urlparse, search, states;
(function () {
  "use strict"; 
  
  // immutable.js (undo for free)
  redux = {
    query: undefined,
    context: {
      id: 16,
      name: "World Wide Graph (w2g)" 
    },
    history: [],
    entity: {}
  }

  var ResourceTable = {
    render: function() {
      this.clear();
      Entity.resources(redux.entity.id, function(resp) {
        redux.entity.resources = resp.resources;
        $(redux.entity.resources).each(function(index, rc) {
          $('#resources table tbody').append(
            '<tr>' + 
              '<td><input style="border: none;" value="' + rc.title + '"/></td>' +
              '<td><input style="border: none;" value="' + rc.url + '"/></td>' +
              '<td><input style="border: none;" value="' + rc.avatar + '"/></td>' +
              '<td><input style="border: none;" value="' + rc.description + '"/></td>' +
              '</tr>'
          );
        });
      });
    },
    
    clear: function() {
      $('#resources table tbody').empty();
      $('#resource-title').val('');
      $('#resource-url').val('');
      $('#resource-avatar').val('');
      $('#resource-desc').val('');
    }
  }

  var Identifiers = {

  }

  var EveryPage = {
    refresh: function() {
      $('#contexts .selected').text(redux.context.name);
    }
  }

  var SearchResults = {
    clear: function() {
      $('#history ul').empty()
      $("#query").focus();
    },

    render: function(q, cb) {
      var self = this;
      Entity.search(q, function(results) {
        self.clear();
        $(results.entities).each(function(index, entity) {
          $("#history ul").append(
            '<li>' + 
              '<entity id="' + entity.id + '">' + entity.name + '</entity>' +
            '</li>'
          );
        });
        
        if (cb) { cb() }
      });
    }
  }

  var Title = {
    reset: function() {
      var title = redux.history.length ? redux.history[redux.history.length-1].name :
        "World Wide Graph (w2g)";
      $("#title").text(title);
    },
    render: function() {
      $("#title").text(redux.entity.name + ' (' + redux.entity.id + ')');
    },
    update: function() {
      // on click out, save title in db
    }
  };

  var SearchPage = {
    focus: function() {
      $('entity').removeClass('active');
      $('#query').focus();
    },
    hide: function() {
      $("#omnibar").hide();
      $("#history ul").empty();
    },
    render: function(q, cb) {
      Title.reset();
      SearchResults.render(q, function() {
        $("#omnibar").show();
        $("#query").select()
        if (cb) { cb() };
      })
    }
  };

  var EntityPage = {
    reset: function() {
      // clear results pages
      ResourceTable.clear();
      $("#results").addClass("hidden");
      $("#data").empty()
      $("#remoteIds table tbody td input").each(function(i, e) {
        $(e).val('');
      });
      redux.history.pop();
    },
    
    render: function(cb) {
      Entity.get(redux.entity.id, function(entity) {
        SearchPage.hide();
        redux.history.push({
          id: entity.id,
          name: entity.name
        });
        redux.entity = entity;
        ResourceTable.render();
        $("#data").val(JSON.stringify(redux.entity.data));
        $("#results").removeClass("hidden");
        // XXX
        $(redux.entity.remoteIds).each(function(index, remoteId) {        
          var sel = '#source-' + remoteId.source_id + ' input';
          $(sel).val(remoteId.remote_id);
          $(sel).attr('pkey', remoteId.id);
        });
        Title.render()
        if (cb) { cb(entity) }
      });
    }
  };

  var mod = function(n, m) {
    return(((n % m) + m) % m);
  }

  /* Retrieves the next `entity` after `.active` one */
  var nextEntity = function(offset) {
    var entities = $('entity');
    
    // If there are no entities
    if (!entities.length) {
      return(undefined);
    }
    
    var active = $('entity.active').length? $('entity.active')[0] : undefined;

    if (active) {
      var offset = offset || 1;
      var index = entities.index(active);
      if ((index == 0 && offset == -1) || (index == entities.length-1 && offset == 1)) {
        return(undefined)
      }
      return(entities[mod(index + offset, entities.length)]);
    }

    offset = offset || 0;
    return(entities[mod(offset, entities.length)]);
  };


  var selectEntity = function(e) {
    $('#query').blur();
    $('entity').removeClass('active');
    $(e).addClass('active');
  }
  
  // show div model with hierarchical history:
  //Mousetrap.bind("Shift + h", function(e) {
  //});

  Mousetrap.bind("up", function(e) {
    e.preventDefault(); // preserves input pos
    var entity = nextEntity(-1);
    if (entity) {
      redux.entity = {
        id: entity.id,
        name: entity.text
      };
      selectEntity(entity);
    } else {
      SearchPage.focus();
    }
  });

  Mousetrap.bind("down", function(e) {
    var e = nextEntity();
    if (e) {
      redux.entity = {
        id: e.id,
        name: e.text
      };
      selectEntity(e);
    } else {
      SearchPage.focus();
    }
  });

  Mousetrap.bind("enter", function(e) {
    $("#query").blur();
    Entity.create({name: $("#query").val()}, function(data) {
      redux.entity = data;
      EntityPage.render()
    });    
  });

  Mousetrap.bind("left", function(e) {
    EntityPage.reset();
    SearchPage.render($('#query').val(), function() {
      if (redux.entity.id) {
        $("#query").blur();
        $('#' + redux.entity.id).addClass('active');
      }
    });
  });

  Mousetrap.bind("right", function(e) {
    var active = $('entity.active');
    if (active.length) {
      redux.entity = {
        id: active[0].id,
        name: active[0].text
      };
      EntityPage.render();
    }
  });
  
  $(document).on("keyup", "#query", function() {
    SearchResults.render($("#query").val());
  });

  $(document).on("focusout", "#data", function() {
    console.log('Saving data');
  });

  $(document).on("click", "#add-resource", function() {
    console.log('adding resource');
    Resource.create({
      title: $('#resource-title').val(),
      url: $('#resource-url').val(),
      avatar: $('#resource-avatar').val(),
      description: $('#resource-desc').val()
    }, function(rc) {
      Entity.associate_resource(redux.entity.id, rc.id, function(rel) {
        console.log(data);
        ResourceTable.clear();
        ResourceTable.render();
      });
    });
  });

  $(document).on("focusout", "#remoteIds table tbody .value", function() {
    var self = this;
    if ($(self).attr('pkey')) {
      // RemoteId.update($(this).attr('pkey'), {
        //   remote_id: $(this).attr('value'),
      // })
    } else {
      console.log();
      RemoteId.create({
        remote_id: $(self).val(),
        source_id: parseInt($(self).closest('tr').attr('id').split('-')[1]),
        entity_id: parseInt(redux.entity.id)
      }, function(e) {
        console.log(e);
      });
    }
  });

  
  var urlparse = {
    parameters: function(key) {
      var query = window.location.search.substring(1);
      var params = query.split("&");
      if (key) {
        for (var i=0;i<params.length;i++) {
          var item = params[i].split("=");
          var val = item[1];
          if(item[0] == key){return(val);}
        }
        return(undefined);
      }
      return(items);
    }
  }
  
  

  Source.all(function(response) {
    var sources = response.sources;
    $(sources).each(function(index, source) {      
      $('#remoteIds table tbody').append(
        "<tr id='source-" + source.id + "'><td>" + source.entity.name + " ID</td><td><input class='value typeahead'/></td></tr>"        
      );
    });
  });

  // init
  var seedId = urlparse.parameters('id');
  if (seedId) {
    try {
      redux.entity = {
        id: parseInt(seedId),
        name: undefined
      }
      EntityPage.render(function(e) {
        $('#query').val(redux.entity.name);
      });
    } catch(e) {
      console.log('id must be a valid integer Entity ID');
    }
  }
  
}());