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
            return bot.say(':)')
                .then(() => 'askLanguage');
        }
    },

    askLanguage: {
        prompt: (bot) => bot.say('In which language do you want to talk? Enter EN for English or ES for Spanish \n ¿En qué lenguaje deseas hablar? Ingresa EN para Inglés o ES para Español'),
        receive: (bot, message) => {
            const lang = message.text.trim().toLowerCase();
            if(lang != 'en' || lang != 'es')
            {
                return bot.say('Please enter an option/Por favor ingrese una opción')
                .then(() => 'askLanguage');
            }

            dataUser[bot.userId] = {lang:lang};

            const hi = (lang == 'es') ? 'Hola' : 'Hi';

            return bot.say(hi)
                .then(() => 'askName');
        }
    }

    askName: {
        prompt: (bot) => bot.say(((dataUser[bot.userId].lang == 'es') ? 'Cómo te llamas?' : 'How is your name?')),
        receive: (bot, message) => {
            const name = message.text;
            dataUser[bot.userId] = {name:name};
            const nameText = (dataUser[bot.userId].lang == 'es') ? `Genial! Te voy a llamar ${name}.Que necesitas? %[AYUDA](postback:help)` : `Great! I'm calling you ${name}. What do you nedd? %[HELP](postback:help)`;
            return bot.say(nameText)
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