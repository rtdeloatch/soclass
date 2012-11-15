// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
  if (Lists.find().count() === 0) {
    var data = [
      {name: "Math",
       questions: [
          ["How do you add two numbers?", ["unit1"]],
          ["I am confused about subtraction...", ["unit1", "important"]],
          ["is 2 + 3 = 6 or 7 ???", ["unit1", "important"]],
          ["Can someone explain long division to me?", ["unit2"]],
          ["What is a real life example of fractions?", ["unit2", "important"]],
          ["Do percentages always add up to 100?", ["unit2"]],
          ["How many decimal points should I round to in problem 4?", ["unit2"]]
        ]
      },
      {name: "English",
       questions: [
          ["What are the parts of a sentence?", ["unit1"]],
          ["What is an adjective?", ["unit1", "important"]],
          ["When can I use adverbs?", ["unit1"]],
          ["I am confused about direct and indirect speach...", ["unit2"]],
          ["Is the word 'can' past or present tense?", ["unit2", "exam_material"]],
          ["Can someone explain progressive nouns?", ["unit2"]]
        ]
      },
      {name: "History",
       questions: [
          ["What happened during the civil war?", ["unit1", "important"]],
          ["Who was Abraham Lincoln's Vice President?", ["unit1"]],
          ["Is Puerto Rico one of the 50 states?", ["unit2"]],
          ["How good of a president is George W. Bush?", ["unit2", "important"]],
          ["What is America's biggest export?", ["unit2"]]
        ]
      }
    ];

    var timestamp = (new Date()).getTime();
    for (var i = 0; i < data.length; i++) {
      var list_id = Lists.insert({name: data[i].name});
      for (var j = 0; j < data[i].questions.length; j++) {
        var info = data[i].questions[j];
        Questions.insert({list_id: list_id,
                      student: 'Frank',
                      text: info[0],
                      timestamp: timestamp,
                      tags: info[1].slice(0)});
        timestamp += 1; // ensure unique timestamp.
      }
    }
  }
});
