const Homey = require('homey')

const DEVICE_TYPES = ['ZTC-720']

class CarAlarmDriver extends Homey.Driver {
  /**
   * Called when user is presented the list_devices template,
   * this function fetches relevant data from devices and passes
   * it to the front-end
   */
  onPairListDevices(data, callback) {
    Homey.app.zont.loadDevicesForTypes(DEVICE_TYPES)
      .then(devices => callback(null, this.parseDevices(devices)))
      .catch(() => callback(Homey.__('pair.no_devices_found')))
  }

  parseDevices(devices) {
    return devices.map(device => ({
      name: device.name,
      data: {
        id: device.id,
      }
    }))
  }
}

module.exports = CarAlarmDriver
