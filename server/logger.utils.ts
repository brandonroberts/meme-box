import {createLogger, format, transports} from 'winston';
import DailyRotateFile from "winston-daily-rotate-file";
import {LOG_PATH} from "./path.utils";

const { combine, timestamp, printf, colorize, label } = format;

const MESSAGE_SYMBOL = Symbol.for('message')

export const textFormat = (space: string|null = null) => printf(({ level, label, timestamp, message, ...obj }) => {
  const isObject = typeof obj === 'object';

  const symbolKey = Object.getOwnPropertySymbols(obj).find(k => k === MESSAGE_SYMBOL);

  if (isObject) {
    const restObj = obj as any; // because typescript doesnt allow symbols as index?!

    const messageJson = restObj[symbolKey];

    // The custom labels is inside this "message" object, inside the "obj"-argument
    // its not added to the current objects.. yay

    if (messageJson) {
      const messageObj = JSON.parse(messageJson);

      label = messageObj.label ?? label;
    }
  }

  label = label ? `[${label}] ` : '';

  const hasProperties = Object.keys(obj).length !== 0;

  return `${timestamp} ${label}${level}: ${JSON.stringify(message, null, space)} ${hasProperties ? JSON.stringify(obj, null, space) : ''}`;
});


export const timestampInstance =  timestamp({
  format: () => {
    const NOW = new Date();
    const TIMESTAMP = NOW.getTime() - (NOW.getTimezoneOffset() * 60000);

    const DATE_WITH_OFFSET = new Date(TIMESTAMP);

    return DATE_WITH_OFFSET.toISOString().substr(0,19);
  }
});

// Console
export const consoleFormat = (labelName: string) =>  combine(
  colorize(),

  label({
    label: labelName
  }),
  timestampInstance,

  textFormat('  '),
);

export const fileFormat  = (labelName: string) =>   combine(
  timestampInstance,

  label({
    label: labelName
  }),
  textFormat()
);

// TODO move from winston to @tsed/logger for DI injection magic

export function newLogger(label: string, fileName: string) {
  return createLogger({
    level: 'info',
    transports: [
      new transports.Console({
        format: consoleFormat(label),
      }),
      new DailyRotateFile({
        format: fileFormat(label),
        dirname: LOG_PATH,
        filename: fileName,
        extension: '.log'
      })
    ]
  });
}

export const LOGGER = newLogger('MemeBox', 'memebox');

LOGGER.info('##########  Started  ##########');

LOGGER.on('error', function (err) { console.error('LOGGER-ERROR', err)});

function logAndExit (type: string) {
  process.on(type as any, (err: Error) => {
    if (typeof err === 'string') {
      LOGGER.error({type, err});
    } else {
      const message = err.message;
      const stack = err.stack;
      LOGGER.error({type, ...err, message, stack});
    }

    // Exiting the process on error, doesnt work,
    // because the Logging-Stream cant work then to write the error...

    return true;
  });
}

// log and exit for uncaughtException events.
logAndExit('uncaughtException');
// log and exit for unhandledRejection events.
logAndExit('unhandledRejection');
