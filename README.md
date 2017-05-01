# node-speakable

## Description

**node-speakable** is a continuous speech recognition module for node.js.

Basically, **node-speakable** is continuous waiting for you to say something and waits until you finally stopped talking. It then emits an ```speechResult``` event with an ```Array()``` including of your ```recognizedWords```. You can then ```.indexOf()``` the array to trigger some awesome action to happen, like turning on your ```Philips Hue``` lights.

If you ever talked to your XBOX360 (kinect) you're already familiar on how a continuous speech recognition system works for you.

## How

It's pure JavaScript magic... Ok, not yet! Currently node-speakable needs you to __put a binary of ```sox```__ into the modules (into lib) folder to do the recording. The actual voice recognition is then achieved trough a POST to the the Google Speech API.

## Setup

You'll need to ensure that you turn the Google Speech API selection to 'ON' in the API Console. If you don't see it there, you might want to check out this first: http://www.chromium.org/developers/how-tos/api-keys. For the example project, you'll also need to set the environment variable GKEY in your shell to your API key.

## Example usage (node example.js)

```javascript
var Speakable = require('./');

var speakable = new Speakable({key: 'your-google-API-key'});
```
By default, the language is American English ( 'en-US' ), but you can specify another language in the options.
Example usage:
```javascript
var speakable = new Speakable({key: 'your-google-API-key'}, {lang: 'it-IT'});
```

```javascript
speakable.on('speechStart', function() {
  console.log('onSpeechStart');
});

speakable.on('speechStop', function() {
  console.log('onSpeechStop');
});

speakable.on('speechReady', function() {
  console.log('onSpeechReady');
});

speakable.on('error', function(err) {
  console.log('onError:');
  console.log(err);
  speakable.recordVoice();
});

speakable.on('speechResult', function(recognizedWords) {
  console.log('onSpeechResult:')
  console.log(recognizedWords);
  speakable.recordVoice();
});

speakable.recordVoice();
```

## License

**node-speakable** is licensed under the MIT license.

## Todo / Ideas

* Limit maximum listening time
