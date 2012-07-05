var aws = require('aws-lib');
var _ = require('underscore');

module.exports = function(options) {
    var cw = aws.createCWClient(options.awskey, options.awssecret,
        {host: 'monitoring.' + options.region + '.amazonaws.com'});

    var Check = function Check(params) {
        var that = this;
        _(params).each(function(v, k) {
            that[k] = v;
        });
        if (options.daemon) {
            setInterval(function() { that.emit('metric'); }, this.interval);
            this.on('metric', function() {
                this.command(function(res) {
                    that.instance = res.instance;
                    that.value = res.value;
                    that.submit(options, res);
                });
            });
        } else {
            this.submit(options);
        }
    };

    Check.prototype = new process.EventEmitter();

    Check.prototype.submit = function(config, res) {
        var params = {};
        params['Namespace'] = this.namespace;
        params['MetricData.member.1.MetricName'] = this.metricname;
        params['MetricData.member.1.Dimensions.member.1.Name'] = 'InstanceId';
        params['MetricData.member.1.Dimensions.member.1.Value'] = this.instanceid;
        params['MetricData.member.1.Unit'] = this.unit;
        params['MetricData.member.1.Value'] = this.value;
        cw.call("PutMetricData", params, function(result) {
            console.log(JSON.stringify(result));
        });
    };

    return Check;
}
