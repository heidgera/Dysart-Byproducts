var obtains = [
  'fs',
  'µ/color.js',
  'µ/utilities.js',
  'serialport',
  'fivetwelve/es5',
  `${__dirname}/fivetwelve-driver-usbpro-ES5.js`,
  'path'
];

obtain(obtains, (fs, { Color, fadeColors }, utils, Serialport, { default: fivetwelve, param, DmxDevice }, usbProDriver,path)=> {

  console.log(fivetwelve);

  class Light{
    constructor(output, address){
      var _this = this;
      _this.device = new DmxDevice(address, {
        brightness: new param.RangeParam(1),
        color: new param.RgbParam([2, 3, 4]),
        zoom: new param.RangeParam(7),
      });

      _this.display = {};

      _this.display.main = µ('+div', µ('#lightHolder'));
      _this.display.main.className = 'tower';
      _this.display.swatch = µ('+div', _this.display.main);
      _this.display.swatch.className = 'swatch';
      _this.display.spectrum = µ('+div', _this.display.main);
      _this.display.spectrum.className = 'spectrum';
      _this.display.swatch.className = 'swatch';
      _this.display.marker = µ('+div', _this.display.spectrum);
      _this.display.marker.className = 'marker';
      _this.display.knob = µ('+div', _this.display.marker);

      _this.device.setOutput(output);

      _this.device.brightness = 1;
      _this.device.color = '#00aaff';
      _this.device.zoom = 0;
    }

    set color(val){
      var _this = this;
      _this.device.color = val;
      _this.display.swatch.style.backgroundColor = val;
    }

    set brightness(val){
      this.device.brightness = val;
    }

    get brightness(){
      return this.device.brightness;
    }

    set zoom(val){
      this.device.zoom = val;
    }
  }

  class ShowControl {
    constructor(config){
      var _this = this;
      _this.config = config;
      _this.serial = new Serialport(config.serialPort); //'/dev/tty.usbserial-EN228752'

      var driver = new usbProDriver(_this.serial);

      _this.output = fivetwelve(driver);

      _this.timeOffset = 0;

      _this.lights = [];

      for (var i = 0; i < config.lights.length; i++) {
        _this.lights[i] = new Light(_this.output,1+i*config.channelsPerLight);
        _this.lights[i].zoom = config.lights[i].zoom;
        _this.lights[i].channel = config.lights[i].channel;
      }

      _this.output.start(15);

      _this.shows = [];

      config.shows.forEach((show, showIndex)=>{
        let data = [];
        if(show.file){
          let fileRows = fs.readFileSync(path.join(__dirname,show.file)).toString().split('\n');
          data = fileRows.map(row=>row.split(','));
        } else {
          for (var i = 0; i < 6; i++) {
            var tmp = []
            for (let j = 0; j < config.lights.length; j++) {
              tmp.push(1);
            }
            data.push(tmp);
          }

        }
        _this.shows[showIndex] = {
          data: data.map(raw=>{
            return {
              raw: raw
            }
          }),
          duration: show.duration * 60000,
          spectrum: show.spectrum.map(cols=>Color(cols)),
          channels: show.channels
        };

        let newShow = _this.shows[showIndex];

        if(show.static) newShow.static = true;

        //find the minimum and maximum
        let min = newShow.data.map(datum=>datum.raw.min()).min();
        let max = newShow.data.map(datum=>datum.raw.max()).max();


        //normalize the data
        newShow.data.forEach((datum, dataIndex) => {
          if(min == max) newShow.data[dataIndex].norm = datum.raw.map(val=>1);
          else newShow.data[dataIndex].norm = datum.raw.map(val=>(val-min)/(max-min));
          newShow.data[dataIndex].colors = newShow.data[dataIndex].norm.map(norm=>{
            return fadeColors(newShow.spectrum, norm)
          }

          );
        });

      });
    }

    setTime(currentTime){
      this.timeOffset = currentTime - Date.now();
    }

    getTime(){
      return Date.now() + this.timeOffset;
    }

    findShow(){
      var _this = this;
      var show = _this.shows[0];
      var off =  _this.getTime() % _this.runtime;
      //console.log(off);
      for (let i = 0; i < _this.shows.length; i++) {
        off -= _this.shows[i].duration;
        //console.log(off);
        if(off < 0){
          show = _this.changeShow(i, off);
          break;
        }
      }

      return show;
    }

    start(){
      var _this = this;
      _this.running;
      _this.showIndex = 0;
      _this.runtime = _this.shows.reduce((tot, show)=>tot + show.duration, 0);
      _this.offset = _this.getTime() % _this.runtime;

      var show = _this.findShow();

      var fps = 30;

      var bright = 1;
      var last = 0;

      if (_this.runInterval) clearInterval(_this.runInterval);
      _this.runInterval = setInterval(()=> {
        var remaining = (show.endTime - _this.getTime());
        var elapsed = show.duration - remaining;
        if(remaining < 0){
          show = _this.findShow();
        }
        let which = Math.floor(show.data.length * (elapsed) / show.duration);
        let prc = (elapsed % show.period) / show.period;
        for (var i = 0; i < show.channels; i++) {
          if(which < show.data.length){
            let point = show.data[which];
            let next = _this.nextPoint(_this.showIndex,which);
            var pScale = (point.raw[i]==0)?0:1;
            var nScale = (next.raw[i]==0)?0:1;
            var blk = pScale*(1-prc) + nScale*prc;
            //if(i && last != point.raw[i]) last=point.raw[i],console.log(point.raw[i], elapsed/show.duration);
            //var color = fadeColors([point.colors[i].scale(pScale), next.colors[i].scale(nScale)], prc);
            var current = (next.norm[i]*(prc) + point.norm[i]*(1-prc));
            var color = fadeColors(show.spectrum, current);
            color = color.scale(blk);
            _this.lights.forEach(light => {
              if(light.channel == i){
                light.color = color.styleString();
                //var current = (next.norm[i]*(prc) + point.norm[i]*(1-prc));
                light.display.marker.style.left = Math.floor(current * 100) + '%';
              }
            });


          }
        }
      }, fps/1000);
    }

    stop(){
      var _this = this;
      _this.running = false;
      clearInterval(_this.runInterval);
    }

    nextPoint(whichShow, point){
      if(point < this.shows[whichShow].data.length - 1){
        return this.shows[whichShow].data[point + 1];
      } else {
        let nextShow = (whichShow + 1) % this.shows.length;
        var ret = this.shows[nextShow].data[0];
        if(this.shows[nextShow].static){
          ret.colors = this.shows[whichShow].data.last().colors;
        }
        return ret;
      }
    }

    changeShow(index, offset){
      var _this = this;
      _this.showIndex = index;
      var show = _this.shows[index];
      //console.log(index + " is the current show");

      show.period = show.duration / show.data.length;

      show.endTime = _this.getTime() - offset;

      //console.log("next change in " + (show.duration - (Date.now() - show.startTime))/1000 )

      //console.log("start time was x seconds ago:" + ((Date.now() - show.startTime) / 1000));

      _this.lights.forEach(light => {
        var gradString = `linear-gradient(to right`;
        show.spectrum.forEach(color=> {
          gradString += `, ${color.styleString()}`;
        });
        gradString += ')';

        light.display.spectrum.style.setProperty('--gradient', gradString);
      });

      return show;
    }
  }

  exports.ShowControl = ShowControl;
});
