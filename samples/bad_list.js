/*
 *  bad_list.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-03-27
 *
 *  Deal with data that does not exist
 *  Expect to see just 'null'
 */

var Transport = require('../RESTTransport').RESTTransport;

var p = new Transport({
});
p.list(function(ids) {
    console.log(ids);
});
