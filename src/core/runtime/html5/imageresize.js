/**
 * @fileOverview Image控件
 */
define( 'webuploader/core/runtime/html5/imageresize', [
        'webuploader/base',
        'webuploader/core/runtime/html5/runtime'
    ], function( Base, Html5Runtime ) {

        function ImageResize() {

        }

        Html5Runtime.register( 'ImageResize', ImageResize );
        return ImageResize;
    } );