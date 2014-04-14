/**
 * @fileOverview  Transport flash实现
 */
define([
    '../../base',
    './runtime',
    '../client'
], function( Base, FlashRuntime, RuntimeClient ) {
    var $ = Base.$;

    return FlashRuntime.register( 'Transport', {
        init: function() {
            this._status = 0;
            this._response = null;
            this._responseJson = null;
        },

        send: function() {
            var owner = this.owner,
                opts = this.options,
                xhr = this._initAjax(),
                blob = owner._blob,
                server = opts.server,
                binary;

            xhr.connectRuntime( blob.ruid );

            if ( opts.sendAsBinary ) {
                server += (/\?/.test( server ) ? '&' : '?') +
                        $.param( owner._formData );

                binary = blob.uid;
            } else {
                $.each( owner._formData, function( k, v ) {
                    xhr.exec( 'append', k, v );
                });

                xhr.exec( 'appendBlob', opts.fileVal, blob.uid,
                        opts.filename || owner._formData.name || '' );
            }

            this._setRequestHeader( xhr, opts.headers );
            xhr.exec( 'send', {
                method: opts.method,
                url: server
            }, binary );
        },

        getStatus: function() {
            return this._status;
        },

        getResponse: function() {
            return this._response;
        },

        getResponseAsJson: function() {
            return this._responseJson;
        },

        abort: function() {
            var xhr = this._xhr;

            if ( xhr ) {
                xhr.exec('abort');
                xhr.destroy();
                this._xhr = xhr = null;
            }
        },

        destroy: function() {
            this.abort();
        },

        _initAjax: function() {
            var me = this,
                xhr = new RuntimeClient('XMLHttpRequest');

            xhr.on( 'uploadprogress progress', function( e ) {
                return me.trigger( 'progress', e.loaded / e.total );
            });

            xhr.on( 'load', function() {
                var status = xhr.exec('getStatus'),
                    err = '';

                xhr.off();
                me._xhr = null;

                if ( status >= 200 && status < 300 ) {
                    me._response = xhr.exec('getResponse');
                    me._responseJson = xhr.exec('getResponseAsJson');
                } else if ( status >= 500 && status < 600 ) {
                    me._response = xhr.exec('getResponse');
                    me._responseJson = xhr.exec('getResponseAsJson');
                    err = 'server';
                } else {
                    err = 'http';
                }

                xhr.destroy();
                xhr = null;

                return err ? me.trigger( 'error', err ) : me.trigger('load');
            });

            xhr.on( 'error', function() {
                xhr.off();
                me._xhr = null;
                me.trigger( 'error', 'http' );
            });

            me._xhr = xhr;
            return xhr;
        },

        _setRequestHeader: function( xhr, headers ) {
            $.each( headers, function( key, val ) {
                xhr.exec( 'setRequestHeader', key, val );
            });
        }
    });
});