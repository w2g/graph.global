
var redux, search, state0, state1;
(function () {
  'use strict'; 

  // immutable.js (undo for free)
  redux = {
    focus: undefined,
    entity: undefined,
    state: 0
  }

  search = function(q) {
    Entity.search(q, function(results) {
      $('#focus ul').empty();
      redux.focus = undefined;
      $(results.entities).each(function(index, item) {
        $('#focus ul').append('<li id="' + item.id + '">' + item.name + '</li>');
      });
    });
  }  
  state0 = function() {
    $('#title').text('World Wide Graph (w2g)');
    $("#omnibar").show();
    $('#query').focus();
    console.log($("#query").val());
    search($("#query").val());
  }

  state1 = function(title) {
    $("#query").blur();
    $("#focus ul").empty();
    $("#title").text($("#query").val());
    $("#omnibar").hide();
    $("#title").text(title);
    //$("#entity")
  };
  var states = [state0, state1];
  
  Mousetrap.bind('up', function(e) {
    console.log('up');
    var count = $('#focus ul li').length;
    if (count > 0 ) {
      console.log('count: ' + count);
      console.log('focus: ' + focus);
      $("#focus>ul>li.active").removeClass("active");
      if (isNaN(redux.focus)) {
        redux.focus = count - 1;
      } else if (redux.focus == 0) {
        redux.focus = undefined;
        $('#query').focus();
      } else {
        redux.focus = (count + redux.focus - 1) % count;
      }
      $('#focus ul li:eq(' + redux.focus + ')').addClass('active');
    }
  });

  Mousetrap.bind('down', function(e) {
    console.log('down');
    var count = $('#focus ul li').length;
    if (count > 0) {
      $("#focus>ul>li.active").removeClass("active");
      if (isNaN(redux.focus)) {
        redux.focus = 0;
      } else if (redux.focus == count - 1) {
        redux.focus = undefined;
        $('#query').focus();
      } else {
        redux.focus = (redux.focus + 1) % count;
      }
      $('#focus ul li:eq(' + redux.focus + ')').addClass('active');
    }
  });

  Mousetrap.bind('enter', function(e) {
    console.log($("#query").val());
    Entity.create({name: $("#query").val()}, function(data) {
      redux.state = 1;
      states[redux.state]($("#query").val());
      redux.entity = data;
      alert(JSON.stringify(redux.entity));
    });    
  });

  Mousetrap.bind('left', function(e) {
    redux.state -= redux.state > 0 ? 1 : 0;
    states[redux.state]();
  });

  Mousetrap.bind('right', function(e) {
    if (Number.isInteger(redux.focus)) {
      var eid = $('#focus ul li.active')[0].id;
      redux.state = 1;
      states[redux.state]($('#focus ul li.active').text());        
      Entity.get(eid, function(data) {
        alert(JSON.stringify(data));
      });
    }    
  });

  $(document).on('keyup', '#query', function() {
    search($('#query').val());
  });

}());