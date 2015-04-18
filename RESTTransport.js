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

    self.native.use(self._channel(), function(request, response) {
        var ids = [];
        self.list(function(id) {
            if (id !== null) {
                ids.push(self._channel(id));
            } else {
                var rd = {
                    "@id": self._channel(),
                    "item": ids,
                };

                response
                    .set('Content-Type', 'application/json')
                    .send(JSON.stringify(rd, null, 2))
                    ;
            }
        });
    });
};

RESTTransport.prototype._setup_app_thing = function() {
    var self = this;

    self.native.use(self._channel(':id'), function(request, response) {
        self.get(request.params.id, null, function(get_id, get_band, get_value) {
            var rd = {
                "@id": self._channel(request.params.id),
            };

            if (get_value === null) {
                response.status(404);
                rd["error"] = "Not Found";
            } else if (get_value.bands !== null) {
                for (var bi in get_value.bands) {
                    var band = get_value.bands[bi];
                    rd[band] = self._channel(request.params.id, band);
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

    self.native.get(self._channel(':id', ':band'), function(request, response) {
        self.get(request.params.id, request.params.band, function(get_id, get_band, get_value) {
            var rd = {
                "@id": self._channel(request.params.id, request.params.band),
            };

            if (get_value === null) {
                response.status(404);
                rd["error"] = "Not Found";
            } else {
                _.defaults(rd, get_value);
            }

            response
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(rd, null, 2))
                ;
        });
    });

    self.native.put(self._channel(':id', ':band'), function(request, response) {
        self._emitter.emit("updated", {
            id: request.params.id, 
            band: request.params.band, 
            value: request.body,
        });

        var rd = {
            "@id": self._channel(request.params.id, request.params.band),
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

    callback(null);
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

    var channel = self._channel();
};

/**
 *  See {iotdb.transporter.Transport#XXX} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.get = function(paramd, callback) {
};

/**
 *  See {iotdb.transporter.Transport#XXX} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.update = function(id, band, value) {
};

/**
 *  See {iotdb.transporter.Transport#XXX} for documentation.
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
 *  See {iotdb.transporter.Transport#XXX} for documentation.
 *  <p>
 *  Inherently this does nothing. To properly support this
 *  you should use <code>iotdb.transport.bind</code>
 *  to effectively replace this function.
 */
RESTTransport.prototype.remove = function(paramd) {
};

/* -- internals -- */
RESTTransport.prototype._channel = function(id, band, paramd) {
    var self = this;

    paramd = _.defaults(paramd, {
        mkdirs: false,
    });

    var channel = self.initd.prefix;
    if (id) {
        channel = path.join(channel, _encode(id));

        if (band) {
            channel = path.join(channel, _encode(band));
        }
    }

    return channel;
};

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
