var aws = require("aws-lib");

module.exports = function(options) {
    var cw = aws.createCWClient(options.awskey, options.awssecret);
    var Check = function Check(params) {
        var that = this;
        this.interval = params.definition.interval;
        this.command = params.definition.command;
        this.unit = params.definition.unit;
        this.name = params.definition.name;
        this.namespace = params.definition.namespace;

        if (options.daemon) {
            setInterval(function() { that.emit('metric'); }, this.interval);

            this.on('metric', function() {
                this.command(function(res) {
                    // Submit to CloudWatch
                    that.submit(options, res);
                });
            });
        } else {
            Submit(options, Prepare(options));
        }
    };

    Check.prototype = new process.EventEmitter();

    Check.prototype.submit = function(config, res) {
        var data = {};
        data.instanceid = res.instance;
        data.unit = this.unit;
        data.metricname = this.name;
        data.namespace = this.namespace;
        data.value = res.value;
        data = Prepare(data);
        Submit(config, data);
    };

    var Prepare = function(data) {
        var params = {};
        params['Namespace'] = data.namespace;
        params['MetricData.member.1.MetricName'] = data.metricname;
        params['MetricData.member.1.Dimensions.member.1.Name'] = 'InstanceId';
        params['MetricData.member.1.Dimensions.member.1.Value'] = data.instanceid;
        params['MetricData.member.1.Unit'] = data.unit;
        params['MetricData.member.1.Value'] = data.value;
        return params;
    }

    var Submit = function(config, data) {
        this.awskey = config.awskey;
        this.awssecret = config.awssecret;
        // Submit to CloudWatch
        cw.call("PutMetricData", data, function(result) {
            console.log(JSON.stringify(result));
        });
    }

    return Check;
}
