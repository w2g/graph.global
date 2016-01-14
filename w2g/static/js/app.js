var redux, urlparse, search, states;
(function () {
  "use strict"; 
  
  // immutable.js (undo for free)
  redux = {
    query: undefined,
    context: undefined,
    history: [],
    entity: {}
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


  var SearchPage = {

    focus: function() {
      $('entity').removeClass('active');
      $('#query').focus();
    },

    reset: function(cb) {
      $("#history ul").empty();
      $("#omnibar").hide();
      EntityPage.reset();
      $("#query").blur();
    },
        

    render: function(q, cb) {
      // see if history 
      this.reset()
      var title = redux.history.length ? redux.history[redux.history.length-1].name :
        "World Wide Graph (w2g)";
      $("#title").text(title);
      SearchResults.render(q, function() {
        $("#omnibar").show();
        $("#query").select();
      })

    }
  }

  var EntityPage = {
    reset: function() {
      // clear results pages
      $("#results").addClass("hidden");
      $("#data").empty()
      $("#remoteIds table tbody").empty()
      redux.history.pop()
    },
    
    render: function() {
      SearchPage.reset();
      Entity.get(redux.entity.id, function(entity) {
        redux.history.push({
          id: entity.id,
          name: entity.name
        });
        redux.entity = entity;
        $("#data").val(JSON.stringify(redux.entity.data));
        $("#remoteIds table tbody").append(JSON.stringify(redux.entity.remoteIds));
        $("#title").text(redux.entity.name);
        $("#results").removeClass("hidden");
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
      redux.history.push(redux.entity);
      redux.entity = data;
      EntityPage.render()
    });    
  });

  Mousetrap.bind("left", function(e) {
    SearchPage.render()
  });

  Mousetrap.bind("right", function(e) {
    var active = $('entity.active');
    if (active.length) {
      redux.entity = {
        id: active[0].id,
        name: active[0].text
      };
      console.log(redux);
      EntityPage.render()
    }
  });
  
  $(document).on("keyup", "#query", function() {
    SearchResults.render($("#query").val());
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
                 
  // init
  var seedid = urlparse.parameters('id');
  if (seedid) {
    try {
      redux.entity = {
        id: parseInt(seedid),
        name: undefined
      }
      EntityPage.render();
    } catch(e) {
      console.log('id must be a valid integer Entity ID');
    }
  }
  
}());