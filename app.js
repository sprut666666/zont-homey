const Homey = require('homey')
const Zont = require('./lib/Zont')
const { ManagerSettings } = Homey

class App extends Homey.App {
  onInit() {
    this.log('Zont App is running!')
    this.zont = new Zont(this.log, ManagerSettings.get('auth'))
    this.handleSettingsChange = this.handleSettingsChange.bind(this)
    ManagerSettings.on('set', this.handleSettingsChange)
    ManagerSettings.on('unset', this.handleSettingsChange)
  }

  handleSettingsChange(key) {
    switch(key) {
      case 'auth':
        this.zont.updateAuth(ManagerSettings.get('auth'))
        break 
      default:
        break
    }
  }
}

module.exports = App
