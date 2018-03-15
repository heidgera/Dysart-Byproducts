'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = (function () {
  function defineProperties(target, props) { for (var i = 0; i < props.length; i++) {
      var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor);
    } } return function (Constructor, protoProps, staticProps) {

    if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var DEFAULT_OPTIONS = {
  universeMapping: { 1: 1, 2: 2 },
};

var API_KEY = 0xE403A4C9;
var MESSAGE_LABELS = {
  SEND_DMX: 0x06,
  SET_API_KEY: 0x0D,
  SET_PORT_ASSIGNMENT: 0x93,
};

/**
 * A fivetwelve-driver for the enttec usbpro mk2-interface supporting both
 * dmx-outputs.
 *
 * @example
 *     import fivetwelve from 'fivetwelve';
 *     import Serialport from 'serialport';
 *
 *     // I read somewhere that connection settings like baudrate etc are not
 *     // required as it's just a virtual serialport or something like that
 *     const usbproSerialport = new Serialport('/dev/something');
 *
 *     // configure output for two universes:
 *     const output = fivetwelve(
 *         new EnttecUsbProDriver(usbproSerialport));
 */

var EnttecUsbProDriver = (function () {
  /**
   * Initializes the driver for the given serialport.
   * @param {Serialport} serialport A ready configured node-serialport instance.
   *     Setting up the serialport-connection has to be done externally.
   * @param {object} options
   * @param {object} options.universeMapping A mapping of fivetwelve
   *     universe-numbers to usbpro universes 1/2.
   */

  function EnttecUsbProDriver(serialport) {
    var _this = this;

    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, EnttecUsbProDriver);

    /**
     * @type {Serialport}
     */
    this.serialport = serialport;

    /**
     * @type {object}
     */
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    this.opened = this.awaitSerialportOpened();
    this.ready = this.opened.then(function () {
      return true;//_this.initUsbProMk2();
    });
  }

  /**
   * @typedef {object} Serialport
   * @property {function} write
   * @property {function} drain
   * @property {function} isOpen
   * @property {function} on
   */

  /**
   * Sends the given values to the dmx-interface over the serialport.
   * @param {Buffer} buffer A buffer with the dmx-values to be sent.
   * @param {Number} universe The 1-based universe-number.
   * @returns {Promise} A promise that will be resolved when the buffer is
   *   completely sent.
   */

  _createClass(EnttecUsbProDriver, [{
    key: 'send',
    value: function send(buffer, universe) {
      var _this2 = this;

      var usbProUniverse = 1;

      if (!usbProUniverse) {
        return Promise.resolve();
      }

      // for whatever-reason, dmx-transmission has to start with a zero-byte.
      var frameBuffer = new Buffer(513);
      frameBuffer.writeUInt8(0, 0);
      buffer.copy(frameBuffer, 1);

      var label = MESSAGE_LABELS.SEND_DMX;

      return this.ready.then(function () {
        return _this2.sendPacket(label, frameBuffer);
      });
    },

    /**
     * Returns a Promise that is resolved once the serialport is opened.
     * @returns {Promise<Serialport>} A promise resolving with the
     *     node-serialport-instance.
     * @private
     */
  }, {
    key: 'awaitSerialportOpened',
    value: function awaitSerialportOpened() {
      var _this3 = this;

      if (this.serialport.isOpen) {
        return Promise.resolve(this.serialport);
      }

      return new Promise(function (resolve, reject) {
        _this3.serialport.on('open', function (error) {
          if (error) {
            return reject(error);
          }

          return resolve(_this3.serialport);
        });
      });
    },

    /**
     * Configures both ports of the usbpro-mk2 as outputs (these messages
     * should be ignored by other usbpro-devices).
     * @returns {Promise} A promise resolved when intialization is complete.
     * @private
     */
  }, {
    key: 'sendPacket',
    value: function sendPacket(label, data) {
      var buffer = new Buffer(data.length + 5);

      buffer.writeUInt8(0x7E, 0); // usbpro packet start marker
      buffer.writeUInt8(label, 1);
      buffer.writeUInt16LE(data.length, 2);

      data.copy(buffer, 4);

      buffer.writeUInt8(0xE7, buffer.length - 1); // usbpro packet end marker

      return this.write(buffer);
    },

    /**
     * Writes the raw data to the serialport.
     * @param {Buffer} buffer A buffer to be sent to the serialport.
     * @returns {Promise} a promise that is resolved when the buffer was
     *     completely sent.
     * @private
     */
  }, {
    key: 'write',
    value: function write(buffer) {
      return this.opened.then(function (serialport) {
        return new Promise(function (resolve, reject) {
          serialport.write(buffer, function (err) {
            if (err) {
              return reject(err);
            }

            serialport.drain(function () {
              return resolve();
            });
          });
        });
      });
    },
  },]);

  return EnttecUsbProDriver;
})();

exports['default'] = EnttecUsbProDriver;
module.exports = exports['default'];
