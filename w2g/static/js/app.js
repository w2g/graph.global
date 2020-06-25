$.fn.scroll = function() {
  $('html, body').animate({
    scrollTop: $(this).offset().top + 'px'
  }, 'fast');
  return this; // for chaining...
}

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
    last_search: "",
    history: [],
    entity: {}
  };

  var Provenance = function() {
    var self = this;

    var clear = function() {
      $('#provenance ul').empty();
    };
    var render = function() {
      clear();
      $(redux.history).each(function(index, entity) {
        $('#provenance ul').append(
          '<li><entity id="' + entity.id + '">' + entity.name + '</entity></li>'
        );
      });
    };
    return {
      'render': render,
      'clear': clear
    }
  }()

  var DependencyTable = function() {
    var self = this;
    var clear = function() {
      $('#edges ul').empty();
      $('#edge-relation').val('');
      $('#edge-target').val('');
    };
    var swap_dependency = function(edge) {
      return '<li class="edge">' +
        '<div class="edge-options">' +
          '<a class="make_entity" id="edge-' + edge.id + '">Reify</a>' +
          '<button class="delete_edge btn-secondary" id="edge-' + edge.id + '">X</button>' +
        '</div>' +
        '<span class="relation">' +
        '<span> <entity id="' + edge.source.id + '">' + edge.source.name + '</entity></span>' +
        '<span> <entity id="' + edge.relation.id + '">' + edge.relation.name + '</entity></span>' +
        '<span> <entity id="' + redux.entity.id + '">' + redux.entity.name + '</entity></span>' +
        '</span>' +
        (edge.entities? '<div>i.e. <entity class="alias" id="' + edge.entities[0].id + '">' + edge.entities[0].name + '</entity></div>' : '') +
        '<div class="edge-details"><span class="edge-id">#' + edge.id + '</span>' + 
        ' created on <span class="edge-create-date">' + edge.created  + '</div>' +
        '</li>'
    }

    var rel_dependency = function(edge) {
      return '<li class="edge">' +
        '<div class="edge-options">' +
          '<a class="make_entity" id="edge-' + edge.id + '">Reify</a>' +
          '<button class="delete_edge btn-secondary" id="edge-' + edge.id + '">X</button>' +
        '</div>' +
        '<span class="relation">' +
        '<span> <entity id="' + edge.source.id + '">' + edge.source.name + '</entity></span>' +
        '<span> <entity id="' + edge.relation.id + '">' + edge.relation.name + '</entity></span>' +
        '<span> <entity id="' + edge.target.id + '">' + edge.target.name + '</entity></span>' +
        '</span>' +
        (edge.entities? '<div>i.e. <entity class="alias" id="' + edge.entities[0].id + '">' + edge.entities[0].name + '</entity></div>' : '') +
        '<div class="edge-details"><span class="edge-id">#' + edge.id + '</span>' + 
        ' created on <span class="edge-create-date">' + edge.created  + '</div>' +
        '</li>'
    }

    // Dependencies of (current) redux.entity 
    var dependency = function(edge) {
      return '<li class="edge">' +
        '<div class="edge-options">' +
          '<a class="make_entity" id="edge-' + edge.id + '">Reify</a>' +
          '<button class="delete_edge btn-secondary" id="edge-' + edge.id + '">X</button>' +
        '</div>' +
        '<span class="relation">' +
        '<span> <entity id="' + edge.relation.id + '">' + edge.relation.name + '</entity></span>' +
        '<span> <entity id="' + edge.target.id + '">' + edge.target.name + '</entity></span>' +
        '</span>' +
        (edge.entities? '<div>i.e. <entity class="alias" id="' + edge.entities[0].id + '">' + edge.entities[0].name + '</entity></div>' : '') +
        '<div class="edge-details"><span class="edge-id">#' + edge.id + '</span>' + 
        ' created created on <span class="edge-create-date">' + edge.created  + '</div>' +
        '</li>'
    };
    var render = function(cb) {
      clear();
      Entity.edges(redux.entity.id, function(resp) {
        redux.entity.edges = resp.edges;

        if (redux.entity.as_edge) {
          var alt = redux.entity.as_edge;
          $('#edges ul').append(
            '<li class="edge">' +
              'i.e. <span> <entity id="' + alt.source.id + '">' + alt.source.name + '</entity></span>' +
              '<span> <entity id="' + alt.relation.id + '">' + alt.relation.name + '</entity></span>' +
              '<span> <entity id="' + alt.target.id + '">' + alt.target.name + '</entity></span>' +
              '</li>');
        }

        $(redux.entity.edges.children).each(function(index, edge) {
          $('#edges ul').append(dependency(edge));
        });

        // backrefs
        $(redux.entity.edges.parents).each(function(index, edge) {
          //if (edge.source.id === edge.id) {
            $('#edges ul').append(swap_dependency(edge));
          //}
        });

        // relations
        $(redux.entity.edges.relations).each(function(index, edge) {
          // If you're on the page of an entity like `Tag` (331) which
          // is often used as an edge between two other `Entity`, then
          // the rel_dependency and dependency will be the same.  The
          // case where they will be different is if `Tag` is either
          // the source or the target. Thus, in the case where `Tag`
          // is the edge/relation, this check prevents double inclusion
          // (the edge from being rendered twice)
          //if (edge.relation.id === edge.id) {
            $('#edges ul').append(rel_dependency(edge));
          //}
        });

        if (cb) {
          cb(resp);
        }
      });
    };

    $(document).on("click", ".btn-toggle", function(e) {
      var e = $('#' + $(this).attr('for-id'));
      console.log(e);
      if (e.hasClass('hide')) {
        e.removeClass('hide');
      } else {
        e.addClass('hide');
      }
    });

    $(document).on("click", ".back", function(e) {
      leaveContext(e);      
    });

    document.addEventListener('swiped-left', function(e) {
      leaveContext(e);
    });

    $(document).on("click", "entity", function() {
      var active = $(this);
      if (active.length) {
        EntityPage.render(active[0].id, active[0].text);
      }
    });

    $(document).on("click", ".delete_edge", function() {
      if(confirm("Are you sure you want to delete this edge?")) {
        Edge.delete($(this).attr('id').split('-')[1]);

        EntityPage.render(redux.entity.id, redux.entity.name);

      }
    });

    $(document).on("click", ".make_entity", function() {
      var relation_id = $(this).attr('id').split('-')[1];
      var default_text = $(this).parent().find('.relation').text();
      make_entity(relation_id, default_text);
    });

    var make_entity = function(relation_id, default_text) {
      var entity = prompt("How should this entity read?", default_text);
      console.log(entity);
      var post_data = {'name': entity, 'relation_id': relation_id};
      Entity.create(post_data, function(data) {
        redux.entity = data;
        EntityPage.render(data.id, data.name);
      });
    };

    var create_edge = function(relation_id, target_id) {
      Edge.create(
        redux.entity.id,
        relation_id,
        target_id,
        function(edge) {
          clear();
          render();
        }
      );
    }

    $(document).on("click", "#add-edge", function() {
      var relation = 'input#edge-relation';
      var target = 'input#edge-target';

      var relation_id = $(relation).siblings()[0].innerHTML;
      var target_id = $(target).siblings()[1].innerHTML;

      var relation_exists = function() {
        return !isNaN(parseInt(relation_id));
      }

      var target_exists = function() {
        return !isNaN(parseInt(target_id));
      }

      if (relation_exists() && target_exists()) {
        create_edge(relation_id, target_id);
      } else if (!relation_exists() && !target_exists()) {
        Entity.create({name: $(relation).val()}, function(e1) {
          Entity.create({name: $(target).val()}, function(e2) {
            create_edge(e1.id, e2.id);
          });
        });
      } else if (!relation_exists()) {
        Entity.create({name: $(relation).val()}, function(e1) {
          create_edge(e1.id, target_id);
        });
      } else {
        // Make sure the target entity exists
        Entity.create({name: $(target).val()}, function(e2) {
          create_edge(relation_id, e2.id);
        });
      }
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
        $('#remoteIds ul').append(
          '<li id="source-' + source.id + '">' + source.entity.name  + ': ' +
            '<input class="value typeahead"/>' + 
            '</li>'
        );
      });
    });

    $(document).on("focusout", "#remoteIds ul li .value", function() {
      var self = this;
      if ($(self).attr('pkey')) {
        // RemoteId.update($(this).attr('pkey'), {
        //   remote_id: $(this).attr('value'),
        // })
      } else if ($(self).val()) {
        RemoteId.create({
          remote_id: $(self).val(),
          source_id: parseInt($(self).parent().attr('id').split('-')[1]),
          entity_id: parseInt(redux.entity.id)
        }, function(e) {
          console.log(e);
        });
      } else {
        console.log('No action to take');
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
        $("#remoteIds ul li input").each(function(i, e) {
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
      var fun = q ? Entity.search : function(q, cb) {Entity.leaderboard(cb)};

      fun(q, function(results) {
        self.clear();
        change_url('');
        redux.last_search = q;
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

  var SearchPage = function() {
    var focus = function() {
      $('entity').removeClass('active');
      $('#query').focus();
    };
    var hide = function() {
      $("#omnibar").hide();
      $("#history ul").empty();
    };
    var render = function(q, cb) {
      Title.reset();
      SearchResults.render(q, function() {
        $("#omnibar").show();
        $("#query").select()
        if (cb) { cb() };
      })
    };
    Mousetrap(document.getElementById("omnibar")).bind("up", function(e) {
      e.preventDefault(); // preserves input pos
      var entity = nextEntity(-1);
      if (entity) {
        selectEntity(entity);
        change_url(entity.id);
      } else {
        SearchPage.focus();
        change_url(redux.entity.id);
      }
    });
    Mousetrap(document.getElementById("omnibar")).bind("down", function(e) {
      var entity = nextEntity();
      if (entity) {
        selectEntity(entity);
        change_url(entity.id);
      } else {
        SearchPage.focus();
        change_url(redux.entity.id);
      }
    });

    return {
      'focus': focus,
      'hide': hide,
      'render': render
    };
  }();

  var History = {
    isEmpty: function() {
      return redux.history.length;
    },
    add: function(e) {
      redux.history.push(e)
      Provenance.render();
    },
    pop: function() {
      if (redux.history.length) {
        var last = redux.history.pop();
        Provenance.render();
        return last;
      }
    }
  }

  var EntityPage = function() {
    var reset = function() {
      // clear results pages
      ResourceTable.clear();
      DependencyTable.clear();
      $("#results").addClass("hidden");
      $("#data").empty()
      IdentifierTable.clear();
      History.pop()
    };
    var render = function(id, name, cb) {
      change_url(id);
      redux.entity = {
        'id': id,
        'name': name
      }
      Entity.get(redux.entity.id, function(entity) {
        SearchPage.hide();
        History.add({
          id: entity.id,
          name: entity.name
        });
        redux.entity = entity;
        ResourceTable.render();
        DependencyTable.render(cb);
        $("#data").val(JSON.stringify(redux.entity.data));
        $("#results").removeClass("hidden");

        IdentifierTable.render();
        Title.render()
      });
    };

    return {
      'reset': reset,
      'render': render
    }
  }();

  /* Retrieves the next `entity` after `.active` one */
  var nextEntity = function(offset) {
    var entities = $('entity');

    // If there are no entities
    if (!entities.length) {
      return(undefined);
    }

    var active = $('entity.active').length? $('entity.active')[0] : undefined;

    if (!active && $('#edges ul li entity').length) {
      var active = $('#edges ul li entity')[0];      
      var index = entities.index(active);
      return(entities[mod(index, entities.length)]);
    }

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
    /*
    redux.entity = {
      id: e.id,
      name: e.text
    };
    */
    $('#query').blur();
    $('entity').removeClass('active');
    $(e).addClass('active');
    $(e).scroll();
  }

  // show div model with hierarchical history:
  //Mousetrap.bind("Shift + h", function(e) {
  //});

  Mousetrap.bind("enter", function(e) {
    var $focused = $(':focus');
    var active = $('entity.active');
    if (active.length) {
      EntityPage.render(active[0].id, active[0].text);
    }

    if ($focused.attr('id') === 'query') {
      e.preventDefault(); // preserves input pos
    }
  });

  Mousetrap.bind("ctrl+i", function(e) {
    $('input#edge-relation').focus();
  })

  Mousetrap.bind("ctrl+enter", function(e) {
    var $focused = $(':focus');
    if ($focused.attr('id') === 'query') {
      $("#query").blur();
      Entity.create({name: $("#query").val()}, function(data) {
        redux.entity = data;
        EntityPage.render(data.id, data.name);
      });
    } 
  });

  var leaveContext = function(e) {
    var last = redux.entity;

    EntityPage.reset();

    var len = redux.history.length;
    var entity = History.pop();

    if ($.isEmptyObject(redux.entity) && localStorage.getItem('history')) {
      window.location = localStorage.getItem('history');
    }

    if (len && entity) {
      EntityPage.render(entity.id, entity.name, function(e) {
        var eid = "entity#" + last.id;
        selectEntity($(eid));
      });
    } else if (redux.entity) {
      if (!entity) {
        redux.entity = {};
      }
      var $focused = $(':focus');
      if (!$focused.is('input') || !$focused.is(':visible')) {
        SearchPage.render($('#query').val(), function() {
          if (redux.entity.id) {
            $("#query").blur();
            $('#' + redux.entity.id).addClass('active');
          }
        });
      } else {
        redux.entity = {};
      }
    } 
  }

  Mousetrap.bind("left", function(e) {
    if (!$("input").is(':focus')) {
      leaveContext(e);
    }
  });
  
  Mousetrap.bind("ctrl+del", function(e) {
    var active = $('entity.active');
    if (active.length) {
      if(confirm("Are you sure you want to delete this entity?")) {
        Entity.delete(active[0].id, function(data) {
          $("#query").val(redux.last_search)
          SearchResults.render($("#query").val());
        });
      }
    }
  });

  Mousetrap.bind("tab", function(e) {
    $('entity').removeClass('active');
  });

  Mousetrap.bind("ctrl+right", function(e) {
    var active = $('entity.active');
    var url = active.text();
    if (url.indexOf('http') !== 0) {
      url = 'http://' + url;
    }
    var win = window.open(url, "_blank");
    win.focus();
  });

  Mousetrap.bind("right", function(e) {
    var active = $('entity.active');
    if (active.length) {
      EntityPage.render(active[0].id, active[0].text);
    }
  });

  $(document).on("keyup", "#query", function() {
    SearchResults.render($("#query").val());
  });

  $(document).on("focusout", "#data", function() {
    console.log('Saving data');
  });


  var bind_autocomplete = function(self, selector) {
    $(selector).autocomplete({
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
            response(entities);
          }
        });
      },
      minLength: 2,
      focus: function (event, ui) {
        $(event.target).val(ui.item.label);
        $(selector).val(ui.item.label);
        $(selector).attr('eid', ui.item.value);
        return false;
      },
      select: function (event, ui) {
        $(selector).val(ui.item.label);
        $(selector).attr('eid', ui.item.value);
        return false;
      }
    });
  }

  $(document).on("focusin", "input#edge-target", function() {
    var self = this;
    bind_autocomplete(self, "#edge-target");
  });

  $(document).on("focusin", "#edge-relation", function() {
    var self = this;
    bind_autocomplete(self, "#edge-relation");
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


  var change_url = function(query) {
    var getUrl = window.location;
    var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
    window.history.pushState({
      "html": document.html,
      "pageTitle": document.title + " " + query,
    }, "", baseUrl + "?id=" + query);
  }


  var getJsonFromUrl = function () {
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function(part) {
      var item = part.split("=");
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }


  var options = getJsonFromUrl();
  if (options.search) {
    $('#query').val(options.search)
    redux.last_search = options.search;
    $('#query').val(redux.entity.name);
  }


  // init
  var seedId = urlparse.parameters('id');
  if (seedId) {
    try {
      EntityPage.render(parseInt(seedId), undefined, function(e) {
        $('#query').val(redux.entity.name);
        $("#query").focus();
      });
    } catch(e) {
      console.log('id must be a valid integer Entity ID');
    }
  } else {
    SearchResults.render(null)
  }


}());