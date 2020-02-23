const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');

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

const logger = createLogger({
  // change level if in dev environment versus production
  level: env === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.label({ label: path.basename(process.mainModule.filename) }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    new (require('winston-daily-rotate-file'))({
      filename: `${DailyLogDir}/results-%DATE%.log`,
      format: format.combine(
          format.printf(
            info =>
              `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
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
              `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
          )
      ),
      handleExceptions: true
    })
  ]
});

module.exports = logger;