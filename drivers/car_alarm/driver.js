const Homey = require('homey')

const DEVICE_TYPES = ['ZTC-700M', 'ZTC-710', 'ZTC-720']

const initToggleFlowTriggers = (on, off, toggle) => ({
  on: new Homey.FlowCardTriggerDevice(on).register(),
  off: new Homey.FlowCardTriggerDevice(off).register(),
  toggle: new Homey.FlowCardTriggerDevice(toggle).register(),
})

const initFlowCondition = (name) => (
  new Homey.FlowCardCondition(name).register()
)

const initToggleFlowAction = (on, off) => ({
  on: new Homey.FlowCardAction(on).register(),
  off: new Homey.FlowCardAction(off).register(),
})

class CarAlarmDriver extends Homey.Driver {
  onInit() {
    this.triggers = {
      siren: initToggleFlowTriggers('siren_on', 'siren_off', 'siren_toggle'),
      guardState: initToggleFlowTriggers('guard_state_on', 'guard_state_off', 'guard_state_toggle'),
      autoIgnition: initToggleFlowTriggers('auto_ignition_on', 'auto_ignition_off', 'auto_ignition_toggle'),
      ignitionState: initToggleFlowTriggers('ignition_state_on', 'ignition_state_off', 'ignition_state_toggle'),
      online: initToggleFlowTriggers('online_on', 'online_off', 'online_toggle'),
      shock: initToggleFlowTriggers('shock_on', 'shock_off', 'shock_toggle'),
    }
    this.conditions = {
      siren: initFlowCondition('is_siren_active'),
      guardState: initFlowCondition('is_guard_state_active'),
      autoIgnition: initFlowCondition('is_auto_ignition_active'),
      ignitionState: initFlowCondition('is_ignition_state_active'),
      online: initFlowCondition('is_online_active'),
      shock: initFlowCondition('is_shock_active'),
    }
    this.actions = {
      siren: initToggleFlowAction('siren_on', 'siren_off'),
      guardState: initToggleFlowAction('guard_state_on', 'guard_state_off'),
      autoIgnition: initToggleFlowAction('auto_ignition_on', 'auto_ignition_off'),
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
