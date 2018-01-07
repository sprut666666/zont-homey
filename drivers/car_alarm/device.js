const Homey = require('homey')

class CarAlarmDevice extends Homey.Device {
  async onInit() {
    this.log('zont device init')
    this.log('name:', this.getName())
    this.log('class:', this.getClass())
    this.log('data:', this.getData())

    this.initialize = this.initialize.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)

    this.data = this.getData()
    this.initialize()
  }

  async initialize() {
    if (Homey.app.zont.auth) {
      this.device = await Homey.app.zont.loadDevice(this.data.id)
      this.registerCapabilities()
      this.registerStateChangeListener()
      this.setAvailable()
    } else {
      this.unregisterStateChangeListener()
      this.setUnavailable()
    }
  }

  registerCapabilities() {
    this.registerToggle('onoff.auto_ignition', 'auto-ignition', 'auto-ignition', 'enabled', 'disabled')
    this.registerToggle('locked.guard_state', 'guard-state', 'string', 'enabled', 'disabled')
    this.registerToggle('onoff.siren', 'siren', 'bool', true, false)
    this.registerToggle('onoff.engine_block', 'engine-block', 'bool', true, false)
  }

  handleStateChange(deviceIO) {
    // Toggles
    this.updateCapabilityValue('onoff.auto_ignition', deviceIO['auto-ignition']['state'] !== 'disabled')
    this.updateCapabilityValue('locked.guard_state', deviceIO['guard-state'] === 'enabled')
    this.updateCapabilityValue('onoff.siren', deviceIO['siren'])
    this.updateCapabilityValue('onoff.engine_block', deviceIO['engine-block'])
    // Motions
    this.updateCapabilityValue('alarm_motion.ignition_state', deviceIO['ignition-state'])
    this.updateCapabilityValue('alarm_motion.engine_state', deviceIO['engine-state'])
    this.updateCapabilityValue('alarm_motion.shock', deviceIO['shock'])
    // Contacts
    this.updateCapabilityValue('alarm_contact.hood', deviceIO['hood'])
    this.updateCapabilityValue('alarm_contact.trunk', deviceIO['trunk'])
    this.updateCapabilityValue('alarm_contact.doors', deviceIO['doors'])
    this.updateCapabilityValue('alarm_contact.door1', deviceIO['door-1'])
    this.updateCapabilityValue('alarm_contact.door2', deviceIO['door-2'])
    this.updateCapabilityValue('alarm_contact.door3', deviceIO['door-3'])
    this.updateCapabilityValue('alarm_contact.door4', deviceIO['door-4'])
    // Temperature
    const tempValues = deviceIO['temperature']
    const availableTemp = this.device['temperature_conf']['assignments']
    availableTemp.forEach((type, index) => {
      const currentValue = tempValues[index]
      if (currentValue.state === 'ok') {
        this.updateCapabilityValue(`measure_temperature.${type}`, currentValue.value)
      }
    })
    // Online status
    if (!deviceIO['online']) {
      this.setAvailable()
    } else {
      this.setUnavailable()
    }
  }

  registerAuthChangeListener() {
    Homey.app.zont.on('auth', this.initialize)
  }

  registerStateChangeListener() {
    Homey.app.zont.on(`io:${this.data.id}`, this.handleStateChange)
  }

  unregisterAuthChangeListener() {
    Homey.app.zont.removeListener('auth', this.initialize)
  }

  unregisterStateChangeListener() {
    Homey.app.zont.removeListener(`io:${this.data.id}`, this.handleStateChange)
  }

  updateCapabilityValue(name, value) {
    if (this.getCapabilityValue(name) != value) {
      this.setCapabilityValue(name, value)
    }
  }

  registerToggle(name, portname, type, valueOn = true, valueOff = false) {
    let deviceId = this.data.id
    this.registerCapabilityListener(name, async (value) => {
      const newVelue = value ? valueOn : valueOff
      this.log(`${deviceId} ${portname}:`, value, newVelue)
      await Homey.app.zont.updateDeviceProperty(deviceId, portname, type, newVelue)
    })
  }

  onAdded() {
    this.log('device added')
  }

  onDeleted() {
    this.unregisterAuthChangeListener()
    this.unregisterStateChangeListener()
    this.log('device deleted')
  }
}

module.exports = CarAlarmDevice
