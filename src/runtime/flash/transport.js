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
                url: server,
                forceURLStream: opts.forceURLStream,
                mimeType: 'application/octet-stream'
            }, binary );
        },

        getStatus: function() {
            return this._status;
        },

        getResponse: function() {
            return this._response || '';
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
                var percent = e.loaded / e.total;
                percent = Math.min( 1, Math.max( 0, percent ) );
                return me.trigger( 'progress', percent );
            });

            xhr.on( 'load', function() {
                var status = xhr.exec('getStatus'),
                    readBody = false,
                    err = '',
                    p;

                xhr.off();
                me._xhr = null;

                if ( status >= 200 && status < 300 ) {
                    readBody = true;
                } else if ( status >= 500 && status < 600 ) {
                    readBody = true;
                    err = 'server';
                } else {
                    err = 'http';
                }

                if ( readBody ) {
                    me._response = xhr.exec('getResponse');
                    me._response = decodeURIComponent( me._response );

                    // flash 处理可能存在 bug, 没辙只能靠 js 了
                    // try {
                    //     me._responseJson = xhr.exec('getResponseAsJson');
                    // } catch ( error ) {
                        
                    p = window.JSON && window.JSON.parse || function( s ) {
                        try {
                            return new Function('return ' + s).call();
                        } catch ( err ) {
                            return {};
                        }
                    };
                    me._responseJson  = me._response ? p(me._response) : {};
                        
                    // }
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