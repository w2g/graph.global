$(document).ready(function() {
  function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
  }

  var sel, range;
  var MAGIC_KEY = '@';
  var TAB_KEY = 9;
  var ENTER_KEY = 13;
  var UP_KEY = 38;
  var DOWN_KEY = 40;
  var entities = document.querySelector("#entities ul");
  var startPos = -1;
  var currentPos = -1;
  var context = null;
  var apiurl = 'https://graph.global/v1'

  // avoid Chrome span spamming bug
  // https://stackoverflow.com/a/37635348/837575
  document.querySelector('[contenteditable=true]')
      .addEventListener('DOMNodeInserted', function(event) {
    if (event.target.tagName == 'SPAN') {
      event.target.outerHTML = event.target.innerHTML;
    }
  });

  // Insert the entity tag upon selection
  $('#entities').on('mousedown', 'li', function(event) {
    event.preventDefault()
    selectTag($(this).text());
  });

  function sluggifyTitle() {
    return $("article h2").text().replace(/\[{2}([0-9]+)\:([^\]]+)\]{2}/g, '$2');
  }

  // Parse Graphdown to html
  function parseGraphdown2Html(p) {
    p = p.replace(/\[{2}([0-9]+)\:([^\]]+)\]{2}/g, '<cite w2gid="$1">$2</cite>');
    return p
  }

  // remove graph markup
  function rmW2g(p) {
    p = p.replace(/\[{2}([0-9]+)\:([^\]]+)\]{2}/g, '$2');
    return p
  }

  var renderGraphdown = function() {
    $('summary').empty();
    $('summary').html(
      '<h2>' + parseGraphdown2Html($("article h2").html()) + '</h2>' +
      '<p>' + parseGraphdown2Html($("article section").html()) + '</p>'
    );
  }



  $(document).on('mousedown', '.publish', function(event) {
    event.preventDefault()
    var data = {
      slug: $(".slug").text(),
      title: $("article h2").text(),
      post: $("article section").html().replace(/\u00a0/g, " ")
    }

    if (data.slug && data.title) {

      // see if post with slug exists
      url = apiurl + '/posts?action=search&limit=1&verbose=1&field=slug&query=' + data.slug;
      requests.get(url, function(p) {
        if (p && p.error) {
          console.log('post?');
          console.log(p);
          return;
        } else if (p && p.posts && p.posts.length) {
          // if a post exists, update the post
          requests.post("https://graph.global/v1/posts", data, function(resp) {
            console.log(resp);
            document.location.href = '/posts/' + data.slug;
          });
        } else {
          // otherwise search to see if the w2g tag exists
          Entity.search(rmW2g(data.title), function(es) {
            if (es && es.error) {
              console.log('entity?');
              console.log(es.error);
              return
            } else if (es && es.entities.length) {
              data.entity_id = es.entities[0].id;
                // create post
                requests.post("https://graph.global/v1/posts", data, function(resp) {
                  console.log(resp);
                 document.location.href = '/posts/' + data.slug;
                });
            } else {
              // create representative w2g entity for post
              Entity.create({name: rmW2g(data.title)}, function(tag) {
                data.entity_id = tag.id;
                // create post
                requests.post("https://graph.global/v1/posts", data, function(resp) {
                  console.log(resp);
                 document.location.href = '/posts/' + data.slug;
                });
              });
            }
          });
        }
      });
    } else {
      alert('Title and slug required');
    }
  });

  var selectTags = function(e) {
    console.log(e.which)
    // TagMode: Select or Navigate Entities
    if (startPos > -1 && [TAB_KEY, ENTER_KEY, UP_KEY, DOWN_KEY].includes(e.which)) {
      e.preventDefault();
      var first_tag = $('#entities ul li').first();
      var last_tag = $('#entities ul li').last();
      var this_li = $('#entities ul li.selected');

      if (e.which == TAB_KEY && !this_li.text().startsWith('[[?:')) {
        insertTag(this_li.text());
      } else if (e.which == ENTER_KEY) {
        return selectTag(this_li.text());
      } else if (e.which == UP_KEY) {
        (this_li.index() > 0 ? this_li.prev() : last_tag).addClass('selected');
        this_li.removeClass('selected');
      } else if(e.which == DOWN_KEY) {
        (this_li.index() < $('#entities ul li').length-1 ? this_li.next() : first_tag).addClass('selected');
        this_li.removeClass('selected');
      }
    } else if (e.which == 13) {
//        e.preventDefault();
//        insertDiv();
      }{
    }
  };


  var repaint = function(e) {
    context = document.activeElement;

    // Detect TagMode
    if (startPos == -1) {
      if (e.key == MAGIC_KEY || context.textContent.indexOf('@') > -1) {
        handleSelectionChange(undefined, true);
      }
    } else { // If we're in TagMode
      if(context.textContent.indexOf('@') == -1) {
        reset()
        return;
      }

      // Defer to TagMode overrides
      if ([ENTER_KEY, UP_KEY, DOWN_KEY].includes(e.which)) {
        e.preventDefault();
        return;
      }

      //endTag = getCursorIndex(); replaced by handleSelectionChange

      var tag = context.textContent.slice(startPos, currentPos);
      if (tag) {
        Entity.search(tag, function(result) {
          entities.innerHTML = '';
          $(result.entities).each(function(index, entity) {
            $(entities).append(
              '<li>[[' + entity.id + ':' + entity.name + ']]</li>'
            );
          });
          $(entities).append('<li>[[?:' + tag + ']]</li>');
          $('#entities ul li').first().addClass('selected');
        });
      }
    }
    renderGraphdown();
  };

  function insertTextAtCursor(text) {
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
            range.collapse(false);
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
  }

  function getCursorIndex() {
    return window.getSelection().getRangeAt(0).startOffset;
  }



  function insertDiv() {
    var sel = window.getSelection();
    range = sel.getRangeAt(0);
    var node = document.createElement("div");
    range.insertNode(node);
    handleSelectionChange(); // automatically reset currentPos
  }

  function insertTag(entity) {
    var tag = context.textContent.slice(startPos-1, currentPos);

    var sel = window.getSelection();
    range = sel.getRangeAt(0);
    range.setStart(window.getSelection().anchorNode, range.startOffset - tag.length);
    range.setEnd(window.getSelection().anchorNode, range.startOffset + tag.length);
    range.deleteContents();
    var node = document.createTextNode(entity);
    range.insertNode(node);

    sel = window.getSelection();
    range = sel.getRangeAt(0);
    range.setStart(window.getSelection().focusNode, range.endOffset);
    reset();
  }

  function reset() {
    handleSelectionChange(); // automatically reset currentPos
    startPos = -1;
    entities.innerHTML = '';
  }

  function selectTag(tag) {
    if (tag.startsWith('[[?:')) {
      var txt = tag.slice(4, tag.length - 2);
      Entity.create({name: txt}, function(data) {
        tag = '[[' + data.id + ':' + txt + ']]';
        insertTag(tag);
      })
    } else {
      insertTag(tag);
    }
  }

  const getTextSelection = function (editor) {
    const selection = window.getSelection();

    if (selection != null && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      return {
        start: getTextLength(editor, range.startContainer, range.startOffset),
        end: getTextLength(editor, range.endContainer, range.endOffset)
      };
    } else
      return null;
  }

  const getTextLength = function (parent, node, offset) {
    var textLength = 0;

    if (node.nodeName == '#text')
      textLength += offset;
    else for (var i = 0; i < offset; i++)
      if (node) {
        textLength += getNodeTextLength(node.childNodes[i]);
      }
    if (node && node != parent && node.parentNode)
      textLength += getTextLength(parent, node.parentNode, getNodeOffset(node));
    return textLength;
  }

  const getNodeTextLength = function (node) {
    var textLength = 0;
//    if (node.nodeName == 'BR')
//      textLength = 1;
     if (node.nodeName == '#text')
      textLength = node.nodeValue.length;
    else if (node.childNodes != null)
      for (var i = 0; i < node.childNodes.length; i++)
        textLength += getNodeTextLength(node.childNodes[i]);
    return textLength;
  }

  const getNodeOffset = function (node) {
    return node == null ? -1 : 1 + getNodeOffset(node.previousSibling);
  }

  const handleSelectionChange = function (_, doStart) {
    if (document.activeElement) {
      const textSelection = getTextSelection(document.activeElement);
      
      if (textSelection != null) {
        const text = document.activeElement.innerText;
        const selection = text.slice(textSelection.start, textSelection.end);
        currentPos = textSelection.end;

        if (doStart) {
          startPos = currentPos;
        }
      }
    }
  }

  document.addEventListener('selectionchange', handleSelectionChange);
  $(document).keydown(selectTags);
  $(document).keyup(repaint);
  renderGraphdown();

});