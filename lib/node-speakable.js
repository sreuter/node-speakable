var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    spawn = require('child_process').spawn,
    http = require('http');

var Speakable = function Speakable(options) {
  EventEmitter.call(this);

  options = options || {}

  this.recBuffer = [];
  this.recRunning = false;
  this.apiResult = {};
  this.apiLang = options.lang || "en-US";
  this.cmd = 'sox';
  this.cmdArgs = [
    '-q',
    '-b','16',
    '-d','-t','flac','-',
    'rate','16000','channels','1',
    'silence','1','0.1',(options.threshold || '0.1')+'%','1','1.0',(options.threshold || '0.1')+'%'
  ];

};

util.inherits(Speakable, EventEmitter);
module.exports = Speakable;

Speakable.prototype.postVoiceData = function() {
  var self = this;

  var options = {
    hostname: 'www.google.com',
    path: '/speech-api/v1/recognize?xjerr=1&client=chromium&pfilter=0&maxresults=1&lang=' + self.apiLang,
    method: 'POST',
    headers: {
      'Content-type': 'audio/x-flac; rate=16000'
    }
  };

  var req = http.request(options, function(res) {
    self.recBuffer = [];
    if(res.statusCode !== 200) {
      return self.emit(
        'error',
        'Non-200 answer from Google Speech API (' + res.statusCode + ')'
      );
    }
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      self.apiResult = JSON.parse(chunk);
    });
    res.on('end', function() {
      self.parseResult();
    });
  });

  req.on('error', function(e) {
    self.emit('error', e);
  });

  // write data to request body
  console.log('Posting voice data...');
  for(var i in self.recBuffer) {
    if(self.recBuffer.hasOwnProperty(i)) {
      req.write(new Buffer(self.recBuffer[i],'binary'));
    }
  }
  req.end();
};

Speakable.prototype.recordVoice = function() {
  var self = this;

  var rec = spawn(self.cmd, self.cmdArgs, 'pipe');

  // Process stdout

  rec.stdout.on('readable', function() {
    self.emit('speechReady');
  });

  rec.stdout.setEncoding('binary');
  rec.stdout.on('data', function(data) {
    if(! self.recRunning) {
      self.emit('speechStart');
      self.recRunning = true;
    }
    self.recBuffer.push(data);
  });

  // Process stdin

  rec.stderr.setEncoding('utf8');
  rec.stderr.on('data', function(data) {
    console.log(data)
  });

  rec.on('close', function(code) {
    self.recRunning = false;
    if(code) {
      self.emit('error', 'sox exited with code ' + code);
    }
    self.emit('speechStop');
    self.postVoiceData();
  });
};

Speakable.prototype.resetVoice = function() {
  var self = this;
  self.recBuffer = [];
}

Speakable.prototype.parseResult = function() {
  var recognizedWords = [], apiResult = this.apiResult;
  if(apiResult.hypotheses && apiResult.hypotheses[0]) {
    recognizedWords = apiResult.hypotheses[0].utterance.split(' ');
    this.emit('speechResult', recognizedWords);
  } else {
    this.emit('speechResult', []);
  }
}
