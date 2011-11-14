var fs = require('fs');
var _ = require('underscore');
var Check = require('./lib/Check.js').Check;
var Prepare = require('./lib/Check.js').Prepare;
var Submit = require('./lib/Check.js').Submit;

var argv = require('optimist').argv;

if (!argv.config) {
    console.log("Must provide --config argument which points to json settings file, such as --config settings.json");
    process.exit(1);
}

var options = {};
try {
    var config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));
    for (var key in config) {
        options[key] = config[key];
    }
} catch(e) {
   console.warn('Invalid JSON config file: ' + options.config);
   throw e;
}

if (!options.awskey ||
    !options.awssecret) {
    console.log("Must provide all of awskey and awssecret as --config parameters")
    process.exit(1);
}

// Parse any other arguments
options.metricname = argv.metricname;
options.unit = argv.unit;
options.value = argv.value;
options.instanceid = argv.instanceid;
options.namespace = argv.namespace;

// Use MetricName as flag to determine daemon versus single command.
if (!options.metricname) {
    list = fs.readdirSync('./checks');
    _.each(list, function(name) {
        if (name.substr(-6) == '.check') {
            var def = require('./checks/' + name);
            var check = new Check(def);
            // Listener function
            check.on('metric', function() {
                var output = check.command(function(res) {
                    // Submit to CloudWatch
                    check.submit(options, res);
                });
            });
            // Kick it off.
            check.run();
        }
    });
} else {
    // Need all of these parameters to proceed
    if (!options.unit ||
        !options.namespace ||
        !options.instanceid) {
        console.log("Must provide all of Unit, Value, Namespace, InstanceId, and MetricName, awskey, and awssecret as --config parameters")
        process.exit(1);
    }
    var data = {};
    data = Prepare(options);
    Submit(options, data); 
}
