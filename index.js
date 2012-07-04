var fs = require('fs');
var _ = require('underscore');
var optimist = require('optimist')
.usage('Send metrics to cloudwatch.\n' +
       'Usage: $0 [options]\n\n' +
       'Required options:\n' +
       '  awskey: your AWS key\n' +
       '  awssecret: your AWS secret\n' +
       '  (m)etricname: of CloudWatch metric\n' +
       '  (u)nit: of measurement such as count, percent, bytes, bits, etc.\n' +
       '  (v)alue: of metric to submit\n' +
       '  (i)nstanceid: to which the metric value belongs\n' +
       '  (n)amespace: of metric\n' +
       '  (d)aemon: whether to report metric and exit or daemonize\n' +
       'See CloudWatch API docs for more detail at:\n' +
       '  http://docs.amazonwebservices.com/AmazonCloudWatch/latest/APIReference/')
.alias('region', 'r')
.alias('metric', 'm')
.alias('unit', 'u')
.alias('value', 'v')
.alias('instanceid', 'i')
.alias('namespace', 'n')
.alias('daemon', 'd')
.default('daemon', false);
var argv = optimist.argv;
var options = {};
// Setup configuration options
if (argv.config) {
    try {
        _(JSON.parse(fs.readFileSync(argv.config, 'utf8'))).each(function(v, k) {
            options[k] = v;
        });
    } catch(e) {
        console.warn('Invalid JSON config file: ' + argv.config);
       throw e;
    }
}
// Allow options command-line overrides
_.each(argv, function(v, k) {
    options[k] = argv[k] || options[k];
});

if (!options.awskey ||
    !options.awssecret) {
    console.log("Must provide all of awskey and awssecret as --config parameters")
    process.exit(1);
}

var Check = require('./lib/Check.js')(options);

var active = options.activeChecks;
_(fs.readdirSync('./checks')).each(function(name) {
    if (name.substr(-6) == '.check' && _.indexOf(active, name.split(/\.([^.]*)$/)[0]) > -1) {
        var def = require('./checks/' + name);
        var check = new Check(def);
    }
});
