// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Lists = new Meteor.Collection("lists");
Questions = new Meteor.Collection("Questions");

// ID of currently selected list
Session.set('list_id', null);

// Name of currently selected tag for filtering
Session.set('tag_filter', null);

// When adding tag to a question, ID of the question
Session.set('editing_addtag', null);

// When editing a list name, ID of the list
Session.set('editing_listname', null);

// When editing question text, ID of the question
Session.set('editing_itemname', null);

// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
Meteor.subscribe('lists', function () {
  if (!Session.get('list_id')) {
    var list = Lists.findOne({}, {sort: {name: 1}});
    if (list)
      Router.setList(list._id);
  }
});

// Always be subscribed to the Questions for the selected list.
Meteor.autosubscribe(function () {
  var list_id = Session.get('list_id');
  if (list_id)
    Meteor.subscribe('Questions', list_id);
});


////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };
  return events;
};

var activateInput = function (input) {
  input.focus();
  input.select();
};

////////// Lists //////////

Template.lists.lists = function () {
  return Lists.find({}, {sort: {name: 1}});
};

Template.lists.events({
  'mousedown .list': function (evt) { // select list
    Router.setList(this._id);
  },
  'click .list': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'dblclick .list': function (evt, tmpl) { // start editing list name
    Session.set('editing_listname', this._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    activateInput(tmpl.find("#list-name-input"));
  }
});

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.lists.events(okCancelEvents(
  '#new-list',
  {
    ok: function (text, evt) {
      var id = Lists.insert({name: text});
      Router.setList(id);
      evt.target.value = "";
    }
  }));

Template.lists.events(okCancelEvents(
  '#list-name-input',
  {
    ok: function (value) {
      Lists.update(this._id, {$set: {name: value}});
      Session.set('editing_listname', null);
    },
    cancel: function () {
      Session.set('editing_listname', null);
    }
  }));

Template.lists.selected = function () {
  return Session.equals('list_id', this._id) ? 'selected' : '';
};

Template.lists.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.lists.editing = function () {
  return Session.equals('editing_listname', this._id);
};

////////// Questions //////////

Template.Questions.any_list_selected = function () {
  return !Session.equals('list_id', null);
};

Template.Questions.events(okCancelEvents(
  '#new-question',
  {
    ok: function (text, evt) {
      var tag = Session.get('tag_filter');
      Questions.insert({
        text: text,
        student: 'Frank',
        list_id: Session.get('list_id'),
        done: false,
        timestamp: (new Date()).getTime(),
        tags: tag ? [tag] : []
      });
      evt.target.value = '';
    }
  }));

Template.Questions.events(okCancelEvents(
  '.answer-box',
  {
    ok: function (text, evt) {
      Questions.update({timestamp: this.timestamp}, { $push : { answers : {student: 'Ali', answer: text} }});
      //console.log(Questions.find({timestamp: this.timestamp}));
      Meteor.flush();
      $('#answers-area-' + this.timestamp).show();
      evt.target.value = '';
    }
  }));



Template.Questions.Questions = function () {
  // Determine which Questions to display in main pane,
  // selected based on list_id and tag_filter.

  var list_id = Session.get('list_id');
  if (!list_id)
    return {};

  var sel = {list_id: list_id};
  var tag_filter = Session.get('tag_filter');
  if (tag_filter)
    sel.tags = tag_filter;

  return Questions.find(sel, {sort: {timestamp: -1}});
};

Template.question_item.tag_objs = function () {
  var question_id = this._id;
  return _.map(this.tags || [], function (tag) {
    return {question_id: question_id, tag: tag};
  });
};

Template.question_item.answer_objs = function () {
  var question_id = this._id;
  return _.map(this.answers || [], function (answer) {
    return {question_id: question_id, answer: answer};
  });
};

Template.question_item.done_class = function () {
  return this.done ? 'done' : '';
};

Template.question_item.adding_tag = function () {
  return Session.equals('editing_addtag', this._id);
};

Template.question_item.events({

  'click .addtag': function (evt, tmpl) {
    Session.set('editing_addtag', this._id);
    Meteor.flush(); // update DOM before focus
    activateInput(tmpl.find("#edittag-input"));
  },

  'click': function (evt, tmpl) {
    if(evt.target.className == "question " || evt.target.className == "question-text" || evt.target.className == "display") {
      $('#answers-area-' + this.timestamp).toggle();
      Meteor.flush(); // update DOM before focus
      //$('#answers-area-' + this.timestamp).show();
    }
  },

  'click .remove': function (evt) {
    var tag = this.tag;
    var id = this.question_id;

    evt.target.parentNode.style.opacity = 0;
    // wait for CSS animation to finish
    Meteor.setTimeout(function () {
      Questions.update({_id: id}, {$pull: {tags: tag}});
    }, 300);
  }

});


Template.question_item.events(okCancelEvents(
  '#edittag-input',
  {
    ok: function (value) {
      Questions.update(this._id, {$addToSet: {tags: value}});
      Session.set('editing_addtag', null);
    },
    cancel: function () {
      Session.set('editing_addtag', null);
    }
  }));

////////// Tag Filter //////////

// Pick out the unique tags from all Questions in current list.
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Questions.find({list_id: Session.get('list_id')}).forEach(function (question) {
    _.each(question.tags, function (tag) {
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (! tag_info)
        tag_infos.push({tag: tag, count: 1});
      else
        tag_info.count++;
    });
    total_count++;
  });

  tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
  tag_infos.unshift({tag: null, count: total_count});

  return tag_infos;
};

Template.tag_filter.tag_text = function () {
  return this.tag || "All items";
};

Template.tag_filter.selected = function () {
  return Session.equals('tag_filter', this.tag) ? 'selected' : '';
};

Template.tag_filter.events({
  'mousedown .tag': function () {
    if (Session.equals('tag_filter', this.tag))
      Session.set('tag_filter', null);
    else
      Session.set('tag_filter', this.tag);
  }
});

////////// Tracking selected list in URL //////////

var QuestionsRouter = Backbone.Router.extend({
  routes: {
    ":list_id": "main"
  },
  main: function (list_id) {
    Session.set("list_id", list_id);
    Session.set("tag_filter", null);
  },
  setList: function (list_id) {
    this.navigate(list_id, true);
  }
});

Router = new QuestionsRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});
