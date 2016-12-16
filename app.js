// Copyright 2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
'use strict';

process.env.DEBUG = 'actions-on-google:*';

let ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
let express = require('express');
let bodyParser = require('body-parser');
let _ = require('lodash');
let fs = require('fs');

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({
  type: 'application/json'
}));

app.post('/', function(request, response) {
  console.log('handle post');
  const assistant = new ActionsSdkAssistant({
    request: request,
    response: response
  });

  // this is a mock call. it should be calling a backend api providing deals

  function getDeals(numberOfDeals) {
    return JSON.parse(fs.readFileSync('deals.json', 'utf8'));
  }

  function mainIntent(assistant) {
    console.log('mainIntent');
    let inputPrompt = assistant.buildInputPrompt(true, '<speak>Hi! This is David Fu <break time="1"/> ' +
      'I can read out an ordinal like ' +
      '<say-as interpret-as="ordinal">123</say-as>. Say a number.</speak>', ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
    assistant.ask(inputPrompt);
  }

  function generateMessages(dealsJson) {

    let message = "";
    let deal = dealsJson.deals.pop();

    if (deal.message) {
      message = deal.message;
    }
    return message;
  }

  function findDealIntent(assistant) {

    let dialogState = assistant.getDialogState();
    console.log('dialogState: ' + JSON.stringify(dialogState));
    let number = assistant.getArgument('number');
    console.log('getting number: ' + number);

    // set default number of deals
    if (_.isNull(number)) {
      number = 3;
    }

    if (number > 5) {
      assistant.tell("Hey pal, you are asking for too much!");
    } else {
      let dealsJson = getDeals(number);

      let message = generateMessages(dealsJson);


      let inputPrompt = assistant.buildInputPrompt(true, '<speak>Ok, here are some awesome deals! <break time="1"/> ' + message + ' <break time="1"/> Would you like to add it to your shopping cart?</speak>', ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
      assistant.ask(inputPrompt, dealsJson);


    }
  }

  function rawInput(assistant) {
    console.log('rawInput');
    if (assistant.getRawInput() === 'bye') {
      assistant.tell('Please have a look in your shopping cart. Goodbye!');
    } else {

      let response = assistant.getRawInput();

      let inputPrompt = assistant.buildInputPrompt(true, '<speak>You said, <say-as interpret-as="ordinal">' +
        assistant.getRawInput() + '</say-as></speak>', ['I didn\'t hear a number', 'If you\'re still there, what\'s the number?', 'What is the number?']);
      assistant.ask(inputPrompt);

    }
  }

  let actionMap = new Map();
  actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
  actionMap.set('com.ligerdave.iot.googleaction.finddeals', findDealIntent);
  actionMap.set(assistant.StandardIntents.TEXT, rawInput);

  assistant.handleRequest(actionMap);
});

// Start the server
let server = app.listen(app.get('port'), function() {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]