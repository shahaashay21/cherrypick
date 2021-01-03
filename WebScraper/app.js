require('dotenv').config();
var compression = require('compression');
var helmet = require('helmet')

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
var logger = require('morgan');
var session = require('express-session');
var axios = require('axios');
axios.defaults.headers.common['user-agent'] = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36`;
axios.defaults.timeout = 2000;

var winston = require('./utils/winston');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var amazonRouter = require('./routes/amazon');
var bestbuyRouter = require('./routes/bestbuy');
var walmartRouter = require('./routes/walmart');
var targetRouter = require('./routes/target');
var macysRouter = require('./routes/macys');
var googleRouter = require('./routes/google');

var compareRouter = require('./routes/compare');

var feedbackRouter = require('./routes/feedback');
var accountRouter = require('./routes/account');

var mongoose = require("./models/Mongoose");

var app = express();

app.use(helmet());
app.use(compression());

//Set log middleware
function logRequest(req, res, next) {
  winston.info(req.url)
  next()
}
app.use(logRequest)

function logError(err, req, res, next) {
  winston.error(err)
  next()
}
app.use(logError)

// Initalize session
app.use(session({
  secret: 'web scraping',
  resave: false,
  saveUninitialized: true
}))

// Connect mongo
mongoose.connect((err) => {
  if(err) console.error(err);
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/amazon', amazonRouter);
app.use('/amzn', amazonRouter);
app.use('/bestbuy', bestbuyRouter);
app.use('/walmart', walmartRouter);
app.use('/target', targetRouter);
app.use('/macys', macysRouter);
app.use('/google', googleRouter);

app.use('/compare', compareRouter);

app.use('/feedback', feedbackRouter);
app.use('/account', accountRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
