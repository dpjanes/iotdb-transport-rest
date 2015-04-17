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

var util = require('util');
var url = require('url');

var logger = bunyan.createLogger({
    name: 'iotdb-transport-rest',
    module: 'RESTTransport',
});

/**
 *  Create a web interface for REST.
 *  All the functions in this actually
 *  don't do anything!
 */
var RESTTransport = function (initd) {
    var self = this;

    self.initd = _.defaults(
        initd,
        iotdb.keystore().get("/transports/RESTTransport/initd"),
        {
            prefix: ""
            app: null,

            list: null,     // a function to callback IDs, just like list() below
            bands: null,    // a function
            get: null,
            putt: null,
        }
    );
    
    self.native = 1; // something
};

RESTTransport.prototype = new iotdb.transporter.Transport;

RESTTransport.prototype._setup = function(app) {
    app.get(self.initd.prefix, 
};

/**
 *  List all the IDs associated with this Transport.
 *
 *  The callback is called with a list of IDs
 *  and then null when there are no further values.
 *
 *  Note that this may not be memory efficient due
 *  to the way "value" works. This could be revisited
 *  in the future.
 */
RESTTransport.prototype.list = function(paramd, callback) {
    var self = this;

    if (arguments.length === 1) {
        paramd = {};
        callback = arguments[0];
    }

    // self.initd.listZZ(id, band, callback);
    // callback([ id ])
    // callback(null);
};

/**
 *  Trigger the callback whenever a new thing is added.
 *  NOT FINISHED
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
 */
RESTTransport.prototype.get = function(id, band, callback) {
    var self = this;

    if (!id) {
        throw new Error("id is required");
    }
    if (!band) {
        throw new Error("band is required");
    }

    self.initd.get(id, band, callback);
};

/**
 */
RESTTransport.prototype.update = function(id, band, value) {
    var self = this;

    if (!id) {
        throw new Error("id is required");
    }
    if (!band) {
        throw new Error("band is required");
    }

    var channel = self._channel(id, band, { mkdirs: true });
    var d = _pack(value);

    // do something
};

/**
 */
RESTTransport.prototype.updated = function(id, band, callback) {
    var self = this;

    if (arguments.length === 1) {
        id = null;
        band = null;
        callback = arguments[0];
    } else if (arguments.length === 2) {
        band = null;
        callback = arguments[1];
    }


    // callback(id, band, undefined);
};

/**
 */
RESTTransport.prototype.remove = function(id) {
    var self = this;

    if (!id) {
        throw new Error("id is required");
    }

    var channel = self._channel(id, band);
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


var t = new RESTTransport();
