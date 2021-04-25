const { Plugin } = require('powercord/entities')
const { inject, uninject} = require('powercord/injector')
const { getModule } = require('powercord/webpack')

let camouflageAuto = false
let zeroWidth = ['​', '‍', '‌']
let registeredCommands = [];

module.exports = class CamoTalker extends Plugin {
  startPlugin () {
    this.injection()

    quickRegister(
      'camouflage',
      ['cf', 'camo'],
      'Surrounds a message with zero width characters.',
      '{c} [text]', 
      (args) => ({
        send: true, 
        result: args.join(' ').split('').map((char => {
          return char + zeroWidth[(Math.floor(Math.random() * 3))]
        })).join('').slice(0, -1)
      })
    )

    quickRegister(
      "decamouflage",
      [ "dcf", "decamo"],
      'Sends a non-camouflaged message. Useful if you want to keep camouflaging toggled on.',
      '{c} [text]',
      (args) => ({
        send: true,
        result: args.join(' ') // just send the raw text
      })
    )

    quickRegister(
      'camotoggle',
      ['cft', 'ct'],
      'Automatically camouflages all of your messages.',
      '{c} [text]', 
      this.toggleAuto.bind(this)
    )
  }

  async injection() {
    const messageEvents = await getModule(['sendMessage'])
    inject('camouflage', messageEvents, 'sendMessage', (args) => {
      let text = args[1].content

      if(camouflageAuto)
        text = text.split('').map((char => {
          return char + zeroWidth[(Math.floor(Math.random() * 3))]
        })).join('').slice(0, -1)

      args[1].content = text
      return args  
    }, true)
  }

  async toggleAuto() {
    camouflageAuto = !camouflageAuto
    powercord.api.notices.sendToast('camouflageNotif', {
      header: 'Comouflage Status',
      content: camouflageAuto ? 'Ready to go, solider!' : 'Standing by sir!',
      buttons: [{
        text: 'Dismiss',
        color: camouflageAuto ? 'green' : 'red',
        look: 'outlined',
        onClick: () => powercord.api.notices.closeToast('camouflageNotif')
      }],
      timeout: 3e3
    })
  }

  pluginWillUnload () {
    uninject('camouflage')

    for (command in registeredCommands)
      powercord.api.commands.unregisterCommand(command);
  }
}

function quickRegister(command, aliases, description, usage, executor) {
  registeredCommands.push(command);

  powercord.api.commands.registerCommand({
    command: command,
    aliases: aliases,
    description: description,
    usage: usage,
    executor: executor
  });
}