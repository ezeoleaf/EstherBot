'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;

const scriptRules = require('./script.json');
let dataUser = {};

module.exports = new Script({

    processing: {
        prompt: (bot) => bot.say('...'),
        receive: () => 'processing'
    },

    start: {
        receive: (bot) => {
            return bot.say('Hola :).')
                .then(() => 'askName');
        }
    },

    askName: {
        prompt: (bot) => bot.say('Cómo te llamas?'),
        receive: (bot, message) => {
            bot.setProp('test','Testing');
            const name = message.text;
            dataUser[bot.userId] = {name:name};
            return bot.setProp('namePerson', name)
                .then(() => bot.say(`Genial! Te voy a llamar ${name}.Que necesitas?`))
                .then(() => 'speak');
        }
    },

    speak: {
        receive: (bot, message) => {
            let upperText = message.text.trim().toUpperCase();

            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        return bot.setProp("silent", false);
                    default:
                        return Promise.resolve();
                }
            }

            function getSilent() {
                return bot.getProp("silent");
            }

            function replaceTags(text)
            {
                let sPos = text.indexOf('{') + 1;
                let ePos = text.indexOf('}');
                let lengthTag = ePos - sPos;

                if(sPos == -1 || ePos == -1 || lengthTag < 1) return text;

                let tag = text.substr(sPos,lengthTag);

                let vText = text.split(`{${tag}}`);
                text = vText.join(dataUser[bot.userId][tag]);

                return text;
            }

            function processMessage(isSilent) {
                if (isSilent) {
                    return Promise.resolve("speak");
                }

                if (!_.has(scriptRules, upperText)) {
                    return bot.say(`No entiendo eso.`).then(() => 'speak');
                }

                var response = scriptRules[upperText];
                var lines = response.split('\n');
                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = replaceTags(line.trim());
                    p = p.then(function() {
                        console.log(line);
                        return bot.say(line);
                    });
                })

                return p.then(() => 'speak');
            }

            return updateSilent()
                .then(getSilent)
                .then(processMessage);
        }
    }
});