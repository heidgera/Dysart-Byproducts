var obtains = [
  'fs',
  'µ/color.js',
  'µ/utilities.js',
  'serialport',
  'fivetwelve/es5',
  `${__dirname}/fivetwelve-driver-usbpro-ES5.js`,
];

obtain(obtains, (fs, { Color, fadeColors }, utils, Serialport, { default: fivetwelve, param, DmxDevice }, usbProDriver)=> {

  console.log(fivetwelve);

  var load = (file)=> {
    let sum = {};
    let data = fs.readFileSync(file).toString().split('\n').splice(1);
    sum.data = data.map((row)=>row.split(','));
    sum.data.forEach((datum, ind, arr)=> {
      if (datum.length <= 1) arr.splice(ind, 1);
    });
    sum.date = sum.data.map(row=>new Date(row[0].substr(0, 4) + '-' +
                                          row[0].substr(4, 2) + '-' +
                                          row[0].substr(6, 2) + 'T12:00:00Z'));
    sum.firstYear = sum.date[0].getFullYear();
    sum.lastYear = sum.date.last().getFullYear();
    sum.daily = sum.data.map(row=>row[1]);

    sum.trim = (start, end)=> {
      sum.data.splice(start, end);
      sum.date.splice(start, end);
      sum.daily.splice(start, end);
      sum.firstYear = sum.date[0].getFullYear();
      sum.lastYear = sum.date.last().getFullYear();
    };

    console.log(`first year: ${sum.firstYear}, last year: ${sum.lastYear}`);
    console.log(`min: ${sum.daily.min()}, max: ${sum.daily.max()}, length: ${sum.daily.length}`);

    return sum;
  };

  var makeDisplay = ()=> {
    var ret = {};
    ret.main = µ('+div', µ('#lightHolder'));
    ret.main.className = 'tower';
    ret.swatch = µ('+div', ret.main);
    ret.swatch.className = 'swatch';
    ret.spectrum = µ('+div', ret.main);
    ret.spectrum.className = 'spectrum';
    ret.swatch.className = 'swatch';
    ret.marker = µ('+div', ret.spectrum);
    ret.marker.className = 'marker';
    ret.knob = µ('+div', ret.marker);

    return ret;
  };

  var towers = {
    start() {
      var _this = this;
      var dir = `${__dirname}/../assets/data/`;
      this.sets = fs.readdirSync(dir).map(name=>load(dir + name));

      _this.serial = new Serialport('/dev/tty.usbserial-EN228752');

      // _this.serial.pipe(parser);
      //
      // const parser = new Serialport.parsers.Delimiter({ delimiter: Buffer.from([0xe7]) });

      // setInterval(()=> {
      //   var buffer = new Buffer(5);
      //
      //   buffer.writeUInt8(0x7E, 0); // usbpro packet start marker
      //   buffer.writeUInt8(10, 1);
      //   buffer.writeUInt16LE(0, 2);
      //
      //   buffer.writeUInt8(0xE7, buffer.length - 1); // usbpro packet end marker
      //
      //   this.serial.write(buffer);
      // }, 1000);

      // parser.on('data', (data)=> {
      //   console.log(data);
      // });

      //console.log(fivetwelve.default);

      var driver = new usbProDriver(_this.serial);

      _this.output = fivetwelve(driver);

      console.log(_this.output);

      _this.output.start(15);

      //this.sets = this.sets.slice(1);

      var maxStartYear = this.sets.reduce((acc, cur)=>Math.max(acc, cur.firstYear), 0);
      var minLastYear = this.sets.reduce((acc, cur)=>Math.min(acc, cur.lastYear), 3000);

      this.sets.forEach((set, i, arr)=> {
        var start = set.date.findIndex((element)=>element.getFullYear() == maxStartYear);
        set.trim(0, start);
        var end = set.date.findIndex((element)=>element.getFullYear() == minLastYear + 1);
        if (end > -1) set.trim(end, set.date.length);
        console.log(`first year: ${set.firstYear}, last year: ${set.lastYear}`);
      });

      console.log(`max start year: ${maxStartYear}, min end year: ${minLastYear}`);

      var min = -5;//this.sets.map(set=>set.min()).min();
      var max = 5; //this.sets.map(set=>set.max()).max();

      this.sets.forEach((set, i, arr)=> {
        set.scaled = set.daily.map(point=>Math.min(1, Math.max((point - min) / (max - min), 0)));
        set.display = makeDisplay();

        set.device = new DmxDevice(1 + i * 9, {
          brightness: new param.RangeParam(1),
          color: new param.RgbParam([2, 3, 4]),
          zoom: new param.RangeParam(7),
        });

        // connect the device to the dmx-output
        set.device.setOutput(_this.output);

        // set some values
        set.device.brightness = 1;
        set.device.color = '#ffaa00';
        set.zoom = 0;
      });

      this.sets.forEach(set=> {
        console.log(`min: ${set.scaled.min()}, max: ${set.scaled.max()}`);
      });

      console.log(`overall min: ${min}, overall max: ${max}`);
    },

    runtime: 60000,

    setSpectrum(colorRay) {
      var _this = this;
      this.colors = colorRay;

      var gradString = `linear-gradient(to right`;
      this.colors.forEach(color=> {
        gradString += `, ${color.styleString()}`;
      });
      gradString += ')';
      //linear-gradient(direction, color-stop1, color-stop2, ...);

      console.log(gradString);

      _this.sets.forEach(set=> {
        //set.display.spectrum.style.removeProperty('--gradient-string');
        set.display.spectrum.style.setProperty('--gradient', gradString);
      });

    },

    run() {
      console.log('run');
      var _this = this;
      var len = this.sets.map(set=>set.daily.length).max();
      _this.period = this.runtime / len;

      var fps = 30;

      var framesPerPoint = Math.floor(_this.period * fps / 1000);

      console.log(framesPerPoint);

      var pointCount = 0;

      this.index = 0;

      var maxStartYear = this.sets.reduce((acc, cur)=>Math.max(acc, cur.firstYear), 0);
      var minLastYear = this.sets.reduce((acc, cur)=>Math.min(acc, cur.lastYear), 3000);

      if (this.runInterval) clearInterval(this.runInterval);
      _this.runInterval = setInterval(()=> {
        _this.sets.forEach((set, ind)=> {
          if (_this.index < set.scaled.length - 1) {
            var year = set.date[_this.index].getFullYear();
            set.device.zoom = (year - maxStartYear) / (minLastYear - maxStartYear);
            if (!ind)console.log((year - maxStartYear) / (minLastYear - maxStartYear));
            //Math.floor(_this.index * 7 / set.length) / 7;
            var diff = set.scaled[_this.index + 1] - set.scaled[_this.index];
            set.current = set.scaled[_this.index] + diff * (pointCount / framesPerPoint);
            set.display.marker.style.left = Math.floor(set.current * 100) + '%';
            set.display.swatch.style.backgroundColor = fadeColors(_this.colors, set.current).styleString();
            set.display.swatch.style.width = (5 + 20 * set.device.zoom) + 'vh';
            set.display.swatch.style.height = (5 + 20 * set.device.zoom) + 'vh';
            set.device.color = fadeColors(_this.colors, set.current).styleString();
          }
        });

        //clearTimeout(_this.runTO);
        //_this.runTO = setInterval(_this.fade.bind(_this), _this.period / 10);
        pointCount = (pointCount + 1) % framesPerPoint;
        if (pointCount == 0) _this.index++;
        //_this.index++;
        if (_this.index >= len) clearInterval(_this.runInterval);
      }, 1000 / fps); //_this.period
    },
  };

  //towers.push(new Tower());

  exports.towers = towers;
});
