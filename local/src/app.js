'use strict';

var remote = require('electron').remote;

var process = remote.process;

//remote.getCurrentWindow().closeDevTools();

var obtains = [
  `${__dirname}/towers.js`,
  'µ/color.js',
];

obtain(obtains, ({ towers }, { Color })=> {

  exports.app = {};

  var sent = false;

  exports.app.start = ()=> {

    towers.start();
    towers.setSpectrum([Color([255, 0, 50]), Color([50, 0, 255])]);
    // towers.setSpectrum([Color([255, 0, 0]), Color([255, 127, 0]), Color([255, 255, 0]),
    //                     Color([127, 255, 0]), Color([0, 255, 0]), Color([0, 255, 127]),
    //                     Color([0, 255, 255]), Color([0, 127, 255]), Color([0, 0, 255]),
    //                     Color([127, 0, 255]), Color([255, 0, 255]), Color([255, 0, 127]), ]);
    console.log('started');
    towers.runtime = 10800000;//168750;

    document.onkeypress = (e)=> {
      if (e.key == ' ') towers.run();
    };

    document.onkeyup = (e)=> {
      if (e.which == 27) {
        var electron = require('electron');
        process.kill(process.pid, 'SIGINT');
      } else if (e.which == 73 && e.getModifierState('Control') &&  e.getModifierState('Shift')) {
        remote.getCurrentWindow().toggleDevTools();
      }
    };

    process.on('SIGINT', ()=> {
      process.nextTick(function () { process.exit(0); });
    });
  };

  provide(exports);
});
