/*
 *  send.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-27
 *
 *  Demonstrate sending something
 *  Make sure to see README first
 */

var Transport = require('../RESTTransport').RESTTransport;

var p = new Transport({
});

var _update = function() {
    var now = (new Date()).toISOString();
    console.log("+ sent update", now);
    p.update("MyThingID", "meta", {
        first: "David",
        last: "Janes",
        now: now,
    });
};

setInterval(_update, 10 * 1000);
_update();
