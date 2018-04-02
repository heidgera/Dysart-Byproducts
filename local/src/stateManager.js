obtain(['onoff', 'child_process'], ({ Gpio }, { execSync })=> {
  exports.onChange = ()=> {};

  exports.onShutdown = (cb)=> {};

  var modePin = new Gpio(2, 'in', 'both');
  var stopPin = new Gpio(3, 'in', 'both');

  var shutdownDebounce = 0;
  var modeDebounce = 0;

  var stopCB = (err, val)=> {
    clearTimeout(shutdownDebounce);
    shutdownDebounce = setTimeout(()=> {
      if (!val) {
        exports.onShutdown(()=> {
          execSync('sudo shutdown now');
        });
      }
    }, 50);
  };

  var modeCB = (err, val)=> {
    clearTimeout(modeDebounce);
    modeDebounce = setTimeout(()=> {
      exports.onChange(val);
    }, 50);
  };

  stopPin.watch(stopCB);

  modePin.watch(modeCB);

  exports.close = ()=> {
    modePin.unexport();
    stopPin.unexport();
  };

  exports.forceCheck = ()=> {
    modePin.read(modeCB);
    stopPin.read(stopCB);
  };
});
