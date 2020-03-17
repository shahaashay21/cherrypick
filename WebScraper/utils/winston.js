const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
var stackTrace = require('stack-trace');

const env = process.env.NODE_ENV || 'development';
const logDir = 'logs';
const DailyLogDir = 'logs/daily';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

if (!fs.existsSync(DailyLogDir)) {
  fs.mkdirSync(DailyLogDir);
}

function getLabel() {
  var trace = stackTrace.get();
  if (trace[2]) {
    return `[${path.basename(trace[2].getFileName())}][${trace[2].getFunctionName()}][${trace[2].getLineNumber()}]`;
  } else {
    return path.basename(process.mainModule.filename);
  }
}

function info(msg){
  logger.info(`${getLabel()}::${msg}`);
}

function error(msg){
  logger.error(`${getLabel()}::${msg}`);
}

function debug(msg){
  logger.debug(`${getLabel()}::${msg}`);
}

function warn(msg){
  logger.warn(`${getLabel()}::${msg}`);
}

const logger = createLogger({
  // change level if in dev environment versus production
  level: env === 'production' ? 'info' : 'debug',
  format: format.combine(
    // format.label({ label: path.basename(process.mainModule.filename) }),  //can be used in future, just use info.label in the format.printf
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports: [
    new (require('winston-daily-rotate-file'))({
      filename: `${DailyLogDir}/results-%DATE%.log`,
      format: format.combine(
        format.printf(
          info =>
            `${info.timestamp} [${info.level}]${info.message}`
        )
      ),
      datePattern: 'YYYY-MM-DD',
      prepend: true,
      handleExceptions: true
    }),
    new transports.File({
      filename: `${logDir}/log.log`,
      'maxsize': 5242880,
      format: format.combine(
        format.printf(
          info =>
            `${info.timestamp} [${info.level}]${info.message}`
        )
      ),
      handleExceptions: true
    })
  ]
});

module.exports.logger = logger;
module.exports.info = info;
module.exports.error = error;
module.exports.warn = warn;
module.exports.debug = debug;