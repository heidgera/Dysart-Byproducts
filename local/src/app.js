'use strict';

var remote = require('electron').remote;

var process = remote.process;

//remote.getCurrentWindow().closeDevTools();

var obtains = [
  `${__dirname}/byproduct.js`,
  'µ/color.js',
  './src/MuseServer/express.js',
  './src/MuseServer/wsServer.js',
  './src/controller.js',
  'os',
  'path',
  'fs',
  'serialport',
  'child_process'
  /*`${__dirname}/stateManager.js`,*/
];

obtain(obtains, ({ ShowControl }, { Color }, {fileServer}, {wss}, {MotorControl}, os, path, fs, serial, {execSync}/*, io*/)=> {
  var spectrum = [ Color('8b3cb7'), Color('8b3cb7'),
                          Color('6227a7'), Color('6227a7'), Color('372995'), Color('1f5dbb'),
                          Color('25b7db'), Color('23d2e2'), Color('22d688'),
                          Color('21be25'), Color('dddf31'),
                          Color('fff837'), Color('fff837'), Color('fec62e'), Color('fec62e'), Color('f97822'), Color('f97822'),
                          Color('e83a1a'), Color('e83a1a'), Color('d12c1b'), Color('d12c1b'),];
  var configFile = `${__dirname}/../../config/showControl.json`
  if(os.platform() == 'linux') configFile = '/boot/showControl.json';

  configFile = path.resolve(configFile);

  exports.app = {};

  var sent = false;

  var config = require(configFile);

  exports.app.start = ()=> {
    var motorPort = 'COM20'

    serial.list().then(ports=>{
      ports.forEach((port, i) => {
        if(port.vendorId == '1B4F') motorPort = port.path;
        else if(port.vendorId = '0403') config.serialPort = port.path;
      });

    })

    window.motor = new MotorControl({name: motorPort});


    motor.onready = ()=>{
      motor.run(Math.floor(config.motor.speed));
      motor.direction(config.motor.direction);
      wss.addListener('motorControl', ({details, data})=> {
        console.log('motor speed '+data.speed);
        if (data.speed) {
          var spd = (data.speed>127)?127:data.speed;
          motor.run(Math.floor(spd));
        }
        if(data.direction){
          motor.direction(data.direction);
        }
      });
    }
    var blink = 0;
    var runTO = 0;
    window.control = new ShowControl(config);
    control.lights[0].color = '#00ff00';
    control.start();

    wss.addListener('lightControl', ({details, data})=> {
      if (data.lights && data.lights.length) {
        data.lights.forEach((item, i) => {
          control.lights[i].zoom = item.zoom;
          console.log(`Set zoom of ${i} to ${item.zoom}`);
        });
      }
    });

    wss.addListener('startShow', ({details, data})=>{
      control.start();
    })

    wss.addListener('setTime', ({details, data})=>{
      control.setTime(data.time);
    });

    wss.addListener('shutdown', ({details, data})=>{
      if(os.platform() == 'linux') execSync('sudo shutdown now');
    });

    wss.addListener('writeConfig', ({details, data})=>{
      fs.writeFileSync(configFile, JSON.stringify(data));
      location.reload();
    });

    wss.addListener('colorPicker', ({details, data})=> {
      console.log('here');
      control.stop();
      control.lights.forEach((light, i) => {
        light.color = `rgb(${data.r},${data.g},${data.b})`;
      });

    });

    wss.addListener('getConfig', ({details, data})=> {
      wss.broadcast('config',control.config);
    });
    console.log('started');
    //towers.runtime = 168750 * 64;//10800000;//

    // document.onkeypress = (e)=> {
    //   if (e.key == ' ') towers.run();
    // };

    document.onkeyup = (e)=> {
      if (e.which == 27) {
        var electron = require('electron');
        process.kill(process.pid, 'SIGINT');
      } else if (e.which == 73 && e.getModifierState('Control') &&  e.getModifierState('Shift')) {
        remote.getCurrentWindow().toggleDevTools();
      }
    };

    process.on('SIGINT', ()=> {
      //io.close();
      process.nextTick(function () { process.exit(0); });
    });
  };

  provide(exports);
});
