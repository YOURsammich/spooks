var THROTTLES = {};
var $ = require('jquery-deferred');
module.exports = {
    on : function(id, reset, max) {
        const done = $.Deferred();
        const limit = max || 10;
        const resetTime = reset || 5000;
        let t = THROTTLES[id];
        
        if (!t) {
            t = THROTTLES[id] = {
                count : 0,
                warn : 0
            }
        }
        
        if (t.count === 0) {
            setTimeout(function () {
                t.count = 0;
            }, resetTime);
        }
        
        if (++t.count <= limit) {
            done.resolve();
        } else {
            done.reject();
        }
        
        return done;
    }
};