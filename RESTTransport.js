/*
 *  RESTTransport.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-27
 *
 *  Copyright [2013-2015] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict";

var iotdb = require('iotdb');
var _ = iotdb._;
var bunyan = iotdb.bunyan;

var path = require('path');

var events = require('events');
var util = require('util');
var url = require('url');

var logger = bunyan.createLogger({
    name: 'iotdb-transport-rest',
    module: 'RESTTransport',
});

/* --- constructor --- */

/**
 *  See {iotdb.transporter.Transport#Transport} for documentation.
 *  <p>
 *  Create a web interface for REST.
 *
 *  @param {dictionary} initd
 *
 *  @param {object} app
 *  An ExpressJS app
 */
var RESTTransport = function (initd, app) {
    var self = this;

    self.initd = _.defaults(
        initd,
        {
            channel: iotdb.transporter.channel,
            unchannel: iotdb.transporter.unchannel,
            encode: _encode,
            decode: _decode,
            pack: _pack,
            unpack: _unpack,
        },
        iotdb.keystore().get("/transports/RESTTransport/initd"),
        {
            prefix: "/"
        }
    );
    
    self.native = app;

    self._setup_app_thing_band();
    self._setup_app_thing();
    self._setup_app_things();

    this._emitter = new events.EventEmitter();
};

RESTTransport.prototype = new iotdb.transporter.Transport;

/* --- web --- */

RESTTransport.prototype._setup_app_things = function() {
    var self = this;

    var channel = self.initd.channel(self.initd);

    self.native.use(channel, function(request, response) {
        var ids = [];
        self.list(function(ld) {
            if (ld.end) {
                var rd = {
                    "@id": self.initd.channel(self.initd),
                    "item": ids,
                };

                response
                    .set('Content-Type', 'application/json')
                    .send(JSON.stringify(rd, null, 2))
                    ;

                return;
            }

            ids.push(self.initd.channel(self.initd, ld.id));
        });
    });
};

RESTTransport.prototype._setup_app_thing = function() {
    var self = this;

    var channel = self.initd.channel(self.initd, ':id');

    self.native.use(channel, function(request, response) {
        self.about({
            id: request.params.id, 
        }, function(ad) {
            var rd = {
                "@id": self.initd.channel(self.initd, request.params.id),
            };

            if ((ad.bands === null) || (ad.bands === undefined)) {
                response.status(404);
                rd["error"] = "Not Found";
            } else if (_.is.Array(ad.bands)) {
                for (var bi in ad.bands) {
                    var band = ad.bands[bi];
                    rd[band] = self.initd.channel(self.initd, request.params.id, band);
                }
            }

            response
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(rd, null, 2))
                ;
        });
    });
};

RESTTransport.prototype._setup_app_thing_band = function() {
    var self = this;

    var channel = self.initd.channel(self.initd, ':id', ':band');

    self.native.get(channel, function(request, response) {
        self.get({
            id: request.params.id, 
            band: request.params.band, 
        }, function(gd) {
            var rd = {
                "@id": self.initd.channel(self.initd, request.params.id, request.params.band),
            };

            if (gd.value === null) {
                response.status(404);
                rd["error"] = "Not Found";
            } else {
                _.defaults(rd, gd.value);
            }

            response
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(rd, null, 2))
                ;
        });
    });

    self.native.put(channel, function(request, response) {
        self._emitter.emit("updated", {
            id: request.params.id, 
            band: request.params.band, 
            value: request.body,
        });

        var rd = {
            "@id": self.initd.channel(self.initd, request.params.id, request.params.band),
        };

        response
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(rd, null, 2))
            ;
    });
};

/* --- methods --- */

/**
 *  See {iotdb.transporter.Transport#Transport} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.list = function(paramd, callback) {
    var self = this;

    if (arguments.length === 1) {
        paramd = {};
        callback = arguments[0];
    }

    callback({
        end: true,
        error: new Error("N/A"),
    });
};

/**
 *  See {iotdb.transporter.Transport#Transport} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.added = function(paramd, callback) {
    var self = this;

    if (arguments.length === 1) {
        paramd = {};
        callback = arguments[0];
    }

    var channel = self.initd.channel(self.initd);
};

/**
 *  See {iotdb.transporter.Transport#about} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.about = function(paramd, callback) {
};

/**
 *  See {iotdb.transporter.Transport#get} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.get = function(paramd, callback) {
};

/**
 *  See {iotdb.transporter.Transport#update} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.update = function(id, band, value) {
};

/**
 *  See {iotdb.transporter.Transport#updated} for documentation.
 *  <p>
 *  This will be triggered from the REST/Express API
 */
RESTTransport.prototype.updated = function(paramd, callback) {
    var self = this;

    if (arguments.length === 1) {
        paramd = {};
        callback = arguments[0];
    }

    self._validate_updated(paramd, callback);

    self._emitter.on("updated", function(ud) {
        if (paramd.id && (ud.id !== paramd.id)) {
            return;
        }
        if (paramd.band && (ud.band !== paramd.band)) {
            return;
        }

        callback(ud);
    });
};

/**
 *  See {iotdb.transporter.Transport#remove} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.remove = function(paramd) {
};

/* -- internals -- */
var _encode = function(s) {
    return s.replace(/[\/$%#.\]\[]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
};

var _decode = function(s) {
    return decodeURIComponent(s);
}

var _unpack = function(d) {
    return _.d.transform(d, {
        pre: _.ld_compact,
        key: _decode,
    });
};

var _pack = function(d) {
    return _.d.transform(d, {
        pre: _.ld_compact,
        key: _encode,
    });
};

/**
 *  API
 */
exports.RESTTransport = RESTTransport;
