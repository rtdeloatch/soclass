// Lists -- {name: String}
Lists = new Meteor.Collection("lists");

// Publish complete set of lists to all clients.
Meteor.publish('lists', function () {
  return Lists.find();
});


// Questions -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,
//           timestamp: Number}
Questions = new Meteor.Collection("Questions");

// Publish all items for requested list_id.
Meteor.publish('Questions', function (list_id) {
  return Questions.find({list_id: list_id});
});

