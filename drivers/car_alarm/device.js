const Homey = require('homey')

class CarAlarmDevice extends Homey.Device {
  async onInit() {
    this.log('zont device init')
    this.log('name:', this.getName())
    this.log('class:', this.getClass())
    this.log('data:', this.getData())

    this.initialize = this.initialize.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)

    this.driver = this.getDriver()
    this.data = this.getData()
    this.initialize()
  }

  async initialize() {
    if (Homey.app.zont.auth) {
      this.device = await Homey.app.zont.loadDevice(this.data.id)
      this.registerCapabilities()
      this.registerStateChangeListener()
      this.registerConditions()
      this.registerActions()
      this.setAvailable()
    } else {
      this.unregisterStateChangeListener()
      this.setUnavailable()
    }
  }

  registerCapabilities() {
    const { triggers } = this.driver
    this.registerToggle('onoff', 'auto-ignition', 'auto-ignition', 'enabled', 'disabled', triggers.autoIgnition)
    this.registerToggle('locked', 'guard-state', 'string', 'enabled', 'disabled', triggers.guardState)
    this.registerToggle('speaker_playing', 'siren', 'bool', true, false, triggers.siren)
    // this.registerToggle('onoff.engine_block', 'engine-block', 'bool', true, false)
  }

  registerConditions() {
    const { conditions } = this.driver
    this.registerCondition('onoff', conditions.autoIgnition)
    this.registerCondition('locked', conditions.guardState)
    this.registerCondition('speaker_playing', conditions.siren)
    this.registerCondition('alarm_contact', conditions.ignitionState)  
    this.registerCondition('alarm_tamper', conditions.online)
    this.registerCondition('alarm_motion', conditions.shock)
  }

  registerActions() {
    const { actions } = this.driver
    this.registerToggleAction('onoff', 'auto-ignition', 'auto-ignition', 'enabled', 'disabled', actions.autoIgnition)
    this.registerToggleAction('locked', 'guard-state', 'string', 'enabled', 'disabled', actions.guardState)
    this.registerToggleAction('speaker_playing', 'siren', 'bool', true, false, actions.siren)
  }

  handleStateChange(deviceIO) {
    const { triggers } = this.driver
    // Toggles
    this.updateCapabilityValue('onoff', deviceIO['auto-ignition']['state'] !== 'disabled', triggers.autoIgnition)
    this.updateCapabilityValue('locked', deviceIO['guard-state'] === 'enabled', triggers.guardState)
    this.updateCapabilityValue('speaker_playing', deviceIO['siren'], triggers.siren)
    // this.updateCapabilityValue('onoff.engine_block', deviceIO['engine-block'])
    // Motions
    this.updateCapabilityValue('alarm_contact', deviceIO['ignition-state'], triggers.ignitionState)  
    // this.updateCapabilityValue('alarm_tamper', deviceIO['engine-state'], triggers.engineState)
    this.updateCapabilityValue('alarm_motion', deviceIO['shock'], triggers.shock)
    // Contacts
    // this.updateCapabilityValue('alarm_contact.hood', deviceIO['hood'])
    // this.updateCapabilityValue('alarm_contact.trunk', deviceIO['trunk'])
    // this.updateCapabilityValue('alarm_contact.doors', deviceIO['doors'])
    // this.updateCapabilityValue('alarm_contact.door1', deviceIO['door-1'])
    // this.updateCapabilityValue('alarm_contact.door2', deviceIO['door-2'])
    // this.updateCapabilityValue('alarm_contact.door3', deviceIO['door-3'])
    // this.updateCapabilityValue('alarm_contact.door4', deviceIO['door-4'])
    // // Temperature
    // const tempValues = deviceIO['temperature']
    // const availableTemp = this.device['temperature_conf']['assignments']
    // availableTemp.forEach((type, index) => {
    //   const currentValue = tempValues[index]
    //   if (currentValue.state === 'ok') {
    //     this.updateCapabilityValue(`measure_temperature.${type}`, currentValue.value)
    //   }
    // })
    // Online status
    if (!deviceIO['online']) {
      this.updateCapabilityValue('alarm_tamper', true, triggers.online);
      this.setAvailable()
    } else {
      this.updateCapabilityValue('alarm_tamper', false, triggers.online);
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

  updateCapabilityValue(name, value, trigger) {
    if (this.getCapabilityValue(name) != value) {
      this.setCapabilityValue(name, value)
      this.triggerFlow(trigger, name, value)
    }
  }

  registerToggle(name, portname, type, valueOn = true, valueOff = false, trigger) {
    let deviceId = this.data.id
    this.registerCapabilityListener(name, async (value) => {
      const newValue = value ? valueOn : valueOff
      //this.log(`${deviceId} ${portname}:`, value, newValue)
      await Homey.app.zont.updateDeviceProperty(deviceId, portname, type, newValue)
      this.triggerFlow(trigger, name, value)
    })
  }

  registerCondition(name, condition) {
    condition.registerRunListener((args, state) => (
      Promise.resolve(this.getCapabilityValue(name))
    ))
  }

  registerToggleAction(name, portname, type, valueOn = true, valueOff = false, action) {
    let deviceId = this.data.id
    action.on.registerRunListener(async (args, state) => {
      this.log('action:', name, valueOn)
      await Homey.app.zont.updateDeviceProperty(deviceId, portname, type, valueOn)
      return true
    })
    action.off.registerRunListener(async (args, state) => {
      this.log('action:', name, valueOff)
      await Homey.app.zont.updateDeviceProperty(deviceId, portname, type, valueOff)
      return true
    })
  }

  triggerFlow(trigger, name, value) {
    if (!trigger) {
      return
    }

    this.log('trigger:', name, value)

    switch(name) {
      case 'onoff':
      case 'locked':
      case 'speaker_playing':
      case 'alarm_contact':
      case 'alarm_motion':
      case 'alarm_tamper': {
        trigger.toggle.trigger(this, {}, { value })
        if (value) {
          trigger.on.trigger(this, {}, { value })
        } else {
          trigger.off.trigger(this, {}, { value })
        }
      }
    }
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
