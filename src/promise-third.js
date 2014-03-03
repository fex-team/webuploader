/**
 * @fileOverview 使用jQuery的Promise
 */
define([
    './base'
], function( Base ) {
    var $ = Base.$,
        api = {
            Deferred: $.Deferred,
            when: $.when,

            isPromise: function( anything ) {
                return anything && typeof anything.then === 'function';
            }
        };

    return $.extend( Base, api ) && api;
});