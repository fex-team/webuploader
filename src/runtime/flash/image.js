/**
 * @fileOverview Image
 * @import base.js, runtime/flash/runtime.js, core/file.js, runtime/target.js
 */
define( 'webuploader/runtime/flash/image', [
        'webuploader/base',
        'webuploader/runtime/flash/runtime',
        'webuploader/lib/blob',
        'webuploader/runtime/target'
    ], function( Base, FlashRuntime, Blob, RuntimeTarget ) {

        var $ = Base.$;

        return FlashRuntime.register( 'Image', {
            load: function( src ) {
                var me = this;

                // 只支持Blob
                if ( src instanceof Blob ) {
                    return this.flashExec( 'Image', 'loadFromBlob', src.uid );
                }
            },

            makeThumbnail: function( width, height ) {
                var owner = this.owner,
                    blob, target, base64;

                this.flashExec( 'Image', 'downsize', width, height, true );
                blob = this.flashExec( 'Image', 'getAsBlob', owner.type || 'image/jpeg' );

                target = new RuntimeTarget( 'FileReaderSync' );
                target.connectRuntime( this.owner.getRuid() );
                base64 = target.exec( 'readAsBase64', blob.uid );
                target.destroy();

                return 'data:' + blob.type + ';base64,' + base64;
            },

            downsize: function( width, height ) {
                var opts = this.options;

                return this.flashExec( 'Image', 'downsize', width, height, opts.crop, opts.preserveHeader );
            },

            getOrientation: function() {
                var meta = this.owner.meta;
                return meta.tiff && meta.tiff.Orientation || 1;
            },

            getMetas: function() {
                // @todo
            },

            setMetas: function() {
                // @todo
            },

            destroy: function() {
                this.flashExec( 'Image', 'destroy' );
            },

            getAsBlob: function( type, quality ) {
                var blob = this.flashExec( 'Image', 'getAsBlob', type, quality );
                return new Blob( this.owner.getRuid(), blob );
            }
        } );
    } );