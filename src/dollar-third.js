/**
 * @fileOverview jQuery or Zepto
 */
define(function() {
    var $ = window.__dollar || window.jQuery || window.Zepto;

    if ( !$ ) {
        throw new Error('jQuery or Zepto not found!');
    }

    return $;
});