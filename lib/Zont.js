
const EventEmitter = require('events')
const axios = require('axios')

const ZONT_CLIENT_EMAIL = 'support@microline.ru'
const UPDATE_GAP_SECONDS = 5
const POLL_INTERVAL = 2000

const timestamp = () => Math.round(Date.now() / 1000)

class Zont extends EventEmitter {
  constructor(log, auth) {
    super()
    this.log = log
    this.auth = auth
    this.lastDeviceManualUpdateTime = {}
    this.lastRequestPromise = Promise.resolve()
    this.updateDevicesPollInterval()
    this.log('Zont platform initialized!')
  }

  updateAuth(auth) {
    this.auth = auth
    this.updateDevicesPollInterval()
    this.emit('auth', !!auth)
  }

  updateDevicesPollInterval() {
    clearInterval(this.interval)
    if (this.auth) {
      this.emitDevicesIO()
      this.interval = setInterval(
          () => this.emitDevicesIO(),
          POLL_INTERVAL
      )
    }
  }

  async waitForRequestResolve(newRequest) {
    await new Promise(resolve => this.lastRequestPromise.then(resolve, resolve))
    this.lastRequestPromise = newRequest()
    return this.lastRequestPromise
  }

  request({ method, url, params, data }) {
    return this.waitForRequestResolve(
      () => axios({
        url: `https://zont-online.ru/api${url}`,
        auth: {
          username: this.auth.username,
          password: this.auth.password,
        },
        headers: {
          'X-ZONT-Client': ZONT_CLIENT_EMAIL,
        },
        method,
        params,
        data,
      }).then(response => response.data)
    )
  }

  async loadDevices() {
    const { devices } = await this.request({
      method: 'POST',
      url: '/devices',
      data: { load_io: true },
    })
    return devices
  }

  async loadDevicesForTypes(types) {
    const devices = await this.loadDevices()
    return devices.filter(device => types.includes(device.device_type.code))
  }

  async loadDevice(id) {
    const devices = await this.loadDevices()
    return devices.find(device => device.id === id)
  }

  async updateDeviceProperty(deviceId, portname, type, value) {
    this.lastDeviceManualUpdateTime[deviceId] = timestamp()
    await this.request({
      method: 'POST',
      url: '/set_io_port',
      data: {
        device_id: deviceId,
        value: (type === 'auto-ignition' ? { state: value } : value),
        portname,
        type,
      },
    })
    this.lastDeviceManualUpdateTime[deviceId] = timestamp()
  }

  async emitDevicesIO() {
    const devices = await this.loadDevices()
    devices.forEach(device => {
      const lastDeviceUpdateTime = this.lastDeviceManualUpdateTime[device.id]
      if (lastDeviceUpdateTime && (timestamp() - lastDeviceUpdateTime) <= UPDATE_GAP_SECONDS) {
        return
      }
      this.emit(`io:${device.id}`, device.io)
    })
  }
}

module.exports = Zont
