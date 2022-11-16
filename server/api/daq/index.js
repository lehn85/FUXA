/**
 * 'api/daq': DAQ API to GET/POST storage daq data
 */

var express = require("express");
const authJwt = require('../jwt-helper');

var runtime;
var secureFnc;
var checkGroupsFnc;

module.exports = {
    init: function (_runtime, _secureFnc, _checkGroupsFnc) {
        runtime = _runtime;
        secureFnc = _secureFnc;
        checkGroupsFnc = _checkGroupsFnc;
    },
    app: function () {
        var daqApp = express();
        daqApp.use(function (req, res, next) {
            if (!runtime.project) {
                res.status(404).end();
            } else {
                next();
            }
        });
        
        /**
         * GET daq data
         * Take from daq storage data and reply 
         */
         daqApp.get("/api/daq", secureFnc, function(req, res) {
            try {
                if (req.query && req.query.query) {
                    var query = JSON.parse(req.query.query);
                    var dbfncs = [];
                    for (let i = 0; i < query.sids.length; i++) {
                        if (query.to === query.from) {  // current values
                            dbfncs.push([runtime.devices.getTagValue(query.sids[i], true)]);
                        } else {                        // from history
                            dbfncs.push(runtime.daqStorage.getNodeValues(query.sids[i], query.from, query.to));
                        }
                    }
                    if (query.to === query.from) {  // current values
                        res.json(dbfncs);
                    } else {
                        Promise.all(dbfncs).then(values => {
                            if (values) {
                                res.json(values);
                            } else {
                                res.status(404).end();
                                runtime.logger.error("api get daq: Not Found!");
                            }
                            // io.emit(Events.IoEventTypes.DAQ_RESULT, { gid: msg.gid, values: values });
                        }, reason => {
                            if (reason && reason.stack) {
                                runtime.logger.error(`api get daq: Not Found!: ${reason.stack}`);
                                res.status(400).json({error:"unexpected_error", message: reason.stack});
                            } else {
                                runtime.logger.error(`api get daq: Not Found!: ${reason}`);
                                res.status(400).json({error:"unexpected_error", message: reason});
                            }
                        });
                    }
                } else {
                    res.status(404).end();
                    runtime.logger.error("api get daq: Not Found!");
                }
            } catch (err) {
                if (err && err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api get daq: " + err.message);
            }
        });

/**
         * GET daq data
         * Take from daq storage data, aggregate and reply 
         */
        daqApp.get("/api/daq_agg", secureFnc, function(req, res) {
            try {
                if (req.query && req.query.query) {
                    var query = JSON.parse(req.query.query);
                    if (query.from>=query.to)
                    {
                        res.status(400).json({error:"'From datetime' must be before 'to datetime'", message: reason.stack});
                        return;
                    }                                                            
                                        
                    runtime.daqStorage.getNodesValues(query.sids,query.from,query.to,query.options)
                    .then(values => {
                        if (values) {
                            res.json(values);
                        } else {
                            res.status(404).end();
                            runtime.logger.error("api get daq: Not Found!");
                        }
                        // io.emit(Events.IoEventTypes.DAQ_RESULT, { gid: msg.gid, values: values });
                    }, reason => {
                        if (reason && reason.stack) {
                            runtime.logger.error(`api get daq: Not Found!: ${reason.stack}`);
                            res.status(400).json({error:"unexpected_error", message: reason.stack});
                        } else {
                            runtime.logger.error(`api get daq: Not Found!: ${reason}`);
                            res.status(400).json({error:"unexpected_error", message: reason});
                        }
                    });
                } else {
                    res.status(404).end();
                    runtime.logger.error("api get daq: Not Found!");
                }
            } catch (err) {
                if (err && err.code) {
                    res.status(400).json({error:err.code, message: err.message});
                } else {
                    res.status(400).json({error:"unexpected_error", message:err.toString()});
                }
                runtime.logger.error("api get daq: " + err.message);
            }
        });
        
        return daqApp;
    }
}