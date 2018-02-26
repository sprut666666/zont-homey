const Homey = require('homey')

const DEVICE_TYPES = ['ZTC-700M', 'ZTC-710', 'ZTC-720']

const initToggleFlowTriggers = (on, off) => ({
  on: new Homey.FlowCardTriggerDevice(on).register(),
  off: new Homey.FlowCardTriggerDevice(off).register(),
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
      siren: initToggleFlowTriggers('siren_on', 'siren_off'),
      guardState: initToggleFlowTriggers('guard_state_on', 'guard_state_off'),
      autoIgnition: initToggleFlowTriggers('auto_ignition_on', 'auto_ignition_off'),
      ignitionState: initToggleFlowTriggers('ignition_state_on', 'ignition_state_off'),
      engineState: initToggleFlowTriggers('engine_state_on', 'engine_state_off'),
      shock: initToggleFlowTriggers('shock_on', 'shock_off'),
    }
    this.conditions = {
      siren: initFlowCondition('is_siren_active'),
      guardState: initFlowCondition('is_guard_state_active'),
      autoIgnition: initFlowCondition('is_auto_ignition_active'),
      ignitionState: initFlowCondition('is_ignition_state_active'),
      engineState: initFlowCondition('is_engine_state_active'),
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
