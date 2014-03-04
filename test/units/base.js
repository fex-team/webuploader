define([
    'webuploader/base'
], function( Base ) {

    module('Base');

    test( 'Test dollar', 1, function() {
        ok( Base.$, 'ok' );
    });

    test( 'Test bindFn', 2, function() {
        var obj = {
                name: '123'
            },

            fn = function( arg1 ) {
                ok( this.name, '123', 'The name should be `123`,' );
                ok( arg1, '456', 'The value of first arg should be `456`. ');
            },

            proxyFn = Base.bindFn( fn, obj );

        proxyFn('456');
    });

});