/*
 *  web.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-04-17
 *
 *  Demonstrate receiving
 *  Make sure to see README first
 */

var iotdb = require('iotdb');
var express = require('express');
var RESTTransport = require('../RESTTransport').RESTTransport;
var IOTDBTransport = require("iotdb-transport-iotdb").Transport;

var iot = iotdb.iot();
var things = iot.connect();

var iotdb_transport = new IOTDBTransport(things);

var app = express();

var rest_transport = new RESTTransport({
    prefix: "/api",
}, app);
iotdb.transporter.bind(iotdb_transport, rest_transport, {
});

app.listen(8085, "127.0.0.1", function () {
    console.log("+", "running", "127.0.0.1:8085");
});
