const Homey = require('homey')

module.exports = [{
  method: 'POST',
  path: '/checkAuth',
  fn(args, callback){
    Homey.app.zont.checkAuth(args.body)
      .then(() => callback(null))
      .catch((error) => callback(error))
  }
}]
