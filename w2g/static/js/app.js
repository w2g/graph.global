/*
  How many views are there?
  - DiscoveryPage
  - IncomingPage f:IncomingPage(selection)->ContentPage
  - ContentPage
  - ResourcePage

Escape key jumps 

*/


var redux, urlparse, search, states;
(function () {
  "use strict"; 
  
  // TODO: immutable.js (undo for free)

  redux = {
    query: undefined,
    context: {
      id: 16,
      name: "World Wide Graph (w2g)" 
    },
    history: [],
    entity: {}
  };

  // direction is true, false
  var magnify = function() {

  }


  var DependencyTable = function() {
    var self = this;
    var clear = function() {
      $('#edges table tbody').empty();
      $('#edge-relation').val('');
      $('#edge-target').val('');
    };
    var render = function() {
      clear();
      Entity.edges(redux.entity.id, function(resp) {
        redux.entity.edges = resp.edges;
        $(redux.entity.edges.children).each(function(index, edge) {
          $('#edges table tbody').append(
            '<tr>' + 
              '<td>' + edge.id + '</td>' + 
              '<td><input style="border: none;" value="' + edge.relation.name + '"/></td>' +
              '<td><input style="border: none;" value="' + edge.target.name + '"/></td>' +
              //'<td></td>' + '<td></td>' +
            '</tr>'
          );
        });
      });
    };

    $(document).on("click", "#add-edge", function() {
      console.log('adding edge');
      
      var relation = '#edge-relation';
      var target = '#edge-target';
      var entities = [target, relation];

      var rmake = function(entities) {
        if (entities.length) {
          if (!isNaN(parseInt(entities[0]))) {
            Entity.create($(entities[0]).val(), function(e) {
              $(entities[0]).siblings[0].innerHTML(e.id);
              rmake(entities.slice(1));
            });
          }
        }
      }

      Edge.create(
        redux.entity.id,
        $(relation).siblings()[0].innerHTML,
        $(target).siblings()[0].innerHTML,
        function(edge) {
          clear();
          render();
        }
      );
    });

    return {
      'render': render,
      'clear': clear
    }
  }();

  var ResourceTable = function() {
    var render = function() {
      clear();
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
    };      
    var clear = function() {
      $('#resources table tbody').empty();
      $('#resource-title').val('');
      $('#resource-url').val('');
      $('#resource-avatar').val('');
      $('#resource-desc').val('');
    };

    $(document).on("click", "#add-resource", function() {
      console.log('adding resource');
      Resource.create({
        title: $('#resource-title').val(),
        url: $('#resource-url').val(),
        avatar: $('#resource-avatar').val(),
        description: $('#resource-desc').val()
      }, function(rc) {
        Entity.associate_resource(redux.entity.id, rc.id, function(rel) {
          clear();
          render();
        });
      });
    });

    return {
      'render': render,
      'clear': clear
    }
  }();


  var IdentifierTable = function() {
    // load table header
    Source.all(function(response) {
      var sources = response.sources;
      $(sources).each(function(index, source) {      
        $('#remoteIds table tbody').append(
          "<tr id='source-" + source.id + "'><td>" +
            source.entity.name +
            " ID</td><td><input class='value typeahead'/></td>" +
          "</tr>"
        );
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

    return {
      render: function() {
        this.clear();
        $(redux.entity.remoteIds).each(function(index, remoteId) {        
          var sel = '#source-' + remoteId.source_id + ' input';
          $(sel).val(remoteId.remote_id);
          $(sel).attr('pkey', remoteId.id);
        });
      },

      clear: function() {
        $("#remoteIds table tbody td input").each(function(i, e) {
          $(e).val('');
        });
      }
    }
  }();

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
      DependencyTable.clear();
      $("#results").addClass("hidden");
      $("#data").empty()
      IdentifierTable.clear();
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
        DependencyTable.render();
        $("#data").val(JSON.stringify(redux.entity.data));
        $("#results").removeClass("hidden");

        IdentifierTable.render();
        Title.render()
        if (cb) { cb(entity) }
      });
    }
  };

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
    /*
      
     */

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

  $(document).on("focusin", ".typeahead", function() {
    var self = this;
    console.log('lol');
    console.log(this);
    $(this).autocomplete({
      source: function (request, response) {
        $.ajax({
          url: '/v1/entities?action=search&field=name&query=' + request.term + '&limit=15',
          success: function( data ) {
            var entities = $.map(data.entities, function(entity) {
              return {
                label: entity.name,
                value: entity.id
              };
            });
            console.log(entities);
            response(entities);            
          }
        });
      },
      minLength: 2,
      focus: function (event, ui) {
        $(event.target).val(ui.item.label);
        return false;
      },
      select: function (event, ui) {
        $(self).val(ui.item.label);
        $(self).attr('eid', ui.item.value);
        return false;
      }
    });
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