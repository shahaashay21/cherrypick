require('fs').readdirSync(__dirname + '/').forEach(function (file) {
    if (file.match(/\.js$/) !== null && file !== 'index.js') {
        var name = file.replace('.js', '');
        name = name.replace('_controller', '');
        exports[name] = require('./' + file);
    }
});