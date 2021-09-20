obtain(['µ/serialParser.js', 'events', 'µ/utilities.js'], ({ serialParser }, EventEmitter, utils)=> {
  const RUN = 1;
  const STOP = 2;
  const DIR = 2;
  const READY = 127;

  class MotorControl extends EventEmitter{
    constructor(conf) {
      super();
      var _this = this;
      var parser = new serialParser();

      _this.run = (speed)=>{
        parser.sendPacket([1, RUN, speed]);
      }

      _this.direction = (dir)=>{
        parser.sendPacket([1, RUN, dir]);
      }

      _this.stop = ()=>{
        parser.sendPacket([1, STOP]);
      }

      var readyInt;

      parser.on(READY, ()=> {
        if (!_this.ready) {
          console.log('Controller ready');
          clearInterval(readyInt);
          _this.ready = true;
          _this.emit('ready');
        }
      });

      _this.customData = (dataArray)=> {
        parser.sendPacket(dataArray);
      };

      _this.whenReady = (cb)=> {
        if (_this.ready) {
          cb();
        } else {
          this.on('ready', cb);
        }
      };

      parser.onOpen = ()=> {
        parser.sendPacket([127, READY]);

      };

      _this.onPortNotFound = ()=>{};

      _this.portNotFound = false;

      parser.serial.onPortNotFound = ()=>{
        var _this = this;
        _this.portNotFound = true;
        _this.onPortNotFound();
      }

      if (conf.name) parser.setup({ name: conf.name, baud: 115200 });
      else if (conf.manufacturer) parser.setup({ manufacturer: conf.manufacturer, baud: 115200 });

    }

    set onready(cb) {
      //this.on_load = val;
      if (this.ready) {
        cb();
      } else {
        this.on('ready', cb);
      }
    }
  };

  exports.MotorControl = MotorControl;
});
