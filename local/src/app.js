'use strict';

var remote = require('electron').remote;

var process = remote.process;

//remote.getCurrentWindow().closeDevTools();

var obtains = [
  `${__dirname}/towers.js`,
  'µ/color.js',
  `${__dirname}/stateManager.js`,
];

obtain(obtains, ({ towers }, { Color }, io)=> {

  exports.app = {};

  var sent = false;

  exports.app.start = ()=> {
    var blink = 0;
    var runTO = 0;
    io.onChange = (val)=> {
      console.log(`Pin is now ${val}`);
      if (val) towers.runtime = 900000;
      else towers.runtime = 10800000;
      var state = 0;
      clearInterval(blink);
      clearTimeout(runTO);
      blink = setInterval(()=> {
        if (state) towers.forceColor('#0f0');
        else towers.forceColor('#f0f');
        state = !state;
      }, 250);
      runTO = setTimeout(()=> {
        clearInterval(blink);
        towers.run();
      }, 3000);
    };

    io.onStop = (cb)=> {
      towers.forceColor('#f00');
      //setTimeout(cb, 1000);
    };

    io.forceCheck();

    towers.start();
    //towers.setSpectrum([Color([255, 0, 50]), Color([50, 0, 255])]);
    towers.setSpectrum([Color('d475d7'), Color('d475d7'), Color('bc5dc4'), Color('bc5dc4'), Color('8b3cb7'), Color('8b3cb7'),
                        Color('6227a7'), Color('6227a7'), Color('372995'), Color('1f5dbb'),
                        Color('25b7db'), Color('23d2e2'), Color('22d688'),
                        Color('21be25'), Color('dddf31'),
                        Color('fff837'), Color('fff837'), Color('fec62e'), Color('fec62e'), Color('f97822'), Color('f97822'),
                        Color('e83a1a'), Color('e83a1a'), Color('d12c1b'), Color('d12c1b'),]);
    // towers.setSpectrum([Color([212, 117, 215]), Color([139, 60, 183]), Color([51, 45, 149]),
    //                     Color([38, 186, 223]), Color('8b3cb7'), Color([33, 190, 37]),
    //                     Color([111, 205, 39]), Color([255, 255, 56]), Color([208, 41, 24]), ]);
    console.log('started');
    towers.runtime = 168750 * 64;//10800000;//

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
      io.close();
      process.nextTick(function () { process.exit(0); });
    });
  };

  provide(exports);
});
