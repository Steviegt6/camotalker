const { Plugin } = require('powercord/entities');
const { inject, uninject} = require('powercord/injector');
const { getModule } = require('powercord/webpack');

let camouflageAuto = false;
let workingMarkdown = false;
let zeroWidth = ['​', '‍', '‌'];
let registeredCommands = [];
let markdownCharacters = ['>', '> ' /* ugh I freaking hate MD */, '*', '**', '***', '_', '__', '___', '|', '||', '`', '```']; // TODO: verify

module.exports = class CamoTalker 
  extends Plugin {
  startPlugin() {
    this.injection();

    quickRegister(
      'camouflage',
      ['cf', 'camo'],
      'Surrounds a message with zero width characters.',
      '{c} [text]', 
      (args) => ({
        send: true, 
        result: args.join(' ').split('').map((char => {
          if ((workingMarkdown && markdownCharacters.includes(char)) || random(3) < 2 /* 1/3 chance */)
            return char; // working md ensurance and minimizing the amount of zero-widths to preserve room for typing

          return char + zeroWidth[random(3)];
        })).join('').slice(0, -1)
      })
    );

    quickRegister(
      "decamouflage",
      [ "dcf", "decamo"],
      'Sends a non-camouflaged message. Useful if you want to keep camouflaging toggled on.',
      '{c} [text]',
      (args) => ({
        send: true,
        result: args.join(' ') // just send the raw text
      })
    );

    quickRegister(
      'camotoggle',
      ['cft', 'ct'],
      'Automatically camouflages all of your messages.',
      '{c}', 
      this.toggleAuto.bind(this)
    );

    quickRegister(
      'camotogglemarkdown',
      ['cftmd', 'ctmd', 'camotogglemd'],
      'Allows markdown to work with all of your messages, even when camouflaged.',
      '{c}',
      this.toggleMarkdown.bind(this)
    );
  };

  async injection() {
    const messageEvents = await getModule(['sendMessage']);

    inject('camouflage', messageEvents, 'sendMessage', (args) => {
      let text = args[1].content;

      if (camouflageAuto)
        text = text.split('').map((char => {
          if ((workingMarkdown && markdownCharacters.includes(char)) || random(3) < 2 /* 1/3 chance */)
            return char; // working md ensurance and minimizing the amount of zero-widths to preserve room for typing

          return char + zeroWidth[random(3)];
        })).join('').slice(0, -1);

      args[1].content = text;
      return args; 
    },
    true);
  };

  async toggleAuto() {
    camouflageAuto = !camouflageAuto;

    powercord.api.notices.sendToast('camouflageNotif', {
      header: 'Camouflage Status',
      content: camouflageAuto ? 'Ready to go, solider!' : 'Standing by sir!',
      buttons: [{
        text: 'Dismiss',
        color: camouflageAuto ? 'green' : 'red',
        look: 'outlined',
        onClick: () => powercord.api.notices.closeToast('camouflageNotif')
      }],
      timeout: 3e3
    });
  };

  async toggleMarkdown() {
    workingMarkdown = !workingMarkdown;

    powercord.api.notices.sendToast('camouflageNotif', {
      header: 'Camouflage Status',
      content: workingMarkdown ? 'Witty text about enabling markdown. ;)' : 'Witty text about disabling markdown. :(',
      buttons: [{
        text: 'Dismiss',
        color: workingMarkdown ? 'green' : 'red',
        look: ' outlined',
        onClick: () => powercord.api.notices.closeToast('camouflageNotif')
      }],
      timeout: 3e3
    });
  };

  pluginWillUnload () {
    uninject('camouflage');

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

function random(num) {
  return Math.floor(Math.random() * num);
}