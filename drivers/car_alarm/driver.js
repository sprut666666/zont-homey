const Homey = require('homey')

const DEVICE_TYPES = ['ZTC-700M', 'ZTC-710', 'ZTC-720']

const initToggleFlowTriggers = (on, off) => ({
  on: new Homey.FlowCardTriggerDevice(on).register(),
  off: new Homey.FlowCardTriggerDevice(off).register(),
})

const initCondition = (name) => (
  new Homey.FlowCardCondition('is_siren_active').register()
)

class CarAlarmDriver extends Homey.Driver {
  onInit() {
    this.triggers = {
      siren: initToggleFlowTriggers('siren_on', 'siren_off'),
      guardState: initToggleFlowTriggers('guard_state_on', 'guard_state_off'),
      autoIgnition: initToggleFlowTriggers('auto_ignition_on', 'auto_ignition_off'),
      ignitionState: initToggleFlowTriggers('ignition_state_on', 'ignition_state_off'),
      shock: initToggleFlowTriggers('shock_on', 'shock_off'),
    }
    this.conditions = {
      siren: initCondition('is_siren_active'),
      guardState: initCondition('is_guard_state_active'),
      autoIgnition: initCondition('is_auto_ignition_active'),
      ignitionState: initCondition('is_ignition_state_active'),
      shock: initCondition('is_shock_active'),
    }
  }

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
