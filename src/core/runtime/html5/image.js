/**
 * Terms:
 *
 * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
 * @fileOverview Image控件
 */
define( 'webuploader/core/runtime/html5/image', [ 'webuploader/base',
        'webuploader/core/runtime/html5/runtime'
        ], function( Base, Html5Runtime ) {

    var $ = Base.$,
        rdataurl = /^data:[^;]*;base64,/,
        TYPES = [
            'image/jpeg',
            'image/png'
        ];

    function readAsDataURL( file, cb ) {
        var fr;

        // make sure this is window.FileReader
        if ( FileReader ) {
            fr = new FileReader();
            fr.onload = function() {
                cb( false, this.result );
            };
            fr.onerror = function( e ) {
                cb( false, e.message );
            };
            fr.readAsDataURL( file );
        } else {
            return cb( false, file.getAsDataURL() );
        }
    }

    function blob2DataUrl( blob ) {
        return 'data:' + (blob.type || '') + ';base64,' + btoa( blob );
    }

    function DataUrl2Blob( str ) {
        // todo
    }

    function Html5Image() {
        this.img = null;
        this.info = null;
    }

    $.extend( Html5Image.prototype, {

        load: function( source ) {
            var load = Base.bindFn( this._load, this );

            if ( source instanceof Blob ) {
                readAsDataURL( source, load );
            } else {
                // todo
                // Support DataUrl, url, image.
            }
        },

        getInfo: function() {
            if ( !this.info || this.infoInvalid ) {

            }
            return this.info;
        },

        downsize: function( width, height, crop ) {

        },

        getAsDataURL: function() {
            return this.canvas ? this.canvas.get : this.img.src;
        },

        _load: function( error, data ) {
            var me = this,
                img;

            if ( error ) {
                return me.trigger( 'error', error );
            }

            img = new Image();
            img.onerror = function() {
                me.trigger( 'error', '文件格式不对' );
            };

            img.onload = function() {
                me.trigger( 'load' );
            };

            img.src = rdataurl.test( data ) ? data : blob2DataUrl( data );
            this.img = img;
        },

        _getImg: function() {
            return this.canvas || this.img;
        }
    } );

    Html5Runtime.register( 'Image', Html5Image );
    return Html5Image;
} );