/**
 * @fileOverview Runtime管理器，负责Runtime的选择, 连接
 * @import base.js
 */
define( 'webuploader/runtime/compbase', [ 'webuploader/base' ], function( Base ) {

    function CompBase( runtime ) {

        this.getRuntime = function() {
            return runtime;
        };
    }

    return CompBase;
} );