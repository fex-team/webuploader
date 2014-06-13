/**
 * @fileOverview jQuery or Zepto
 */
define(function() {
    var $ = window.jQuery || window.Zepto;

    if ( !$ ) {
        throw new Error('jQuery or Zepto not found!');
    }

    return $;
});