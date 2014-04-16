/**
 * @fileOverview 使用jQuery的Promise
 */
define([
    './dollar'
], function( $ ) {
    return {
        Deferred: $.Deferred,
        when: $.when,

        isPromise: function( anything ) {
            return anything && typeof anything.then === 'function';
        }
    };
});