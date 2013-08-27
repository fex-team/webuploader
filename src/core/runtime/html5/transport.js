/**
 * @fileOverview Transport
 */
define( 'webuploader/core/runtime/html5/transport', [ 'webuploader/base',
        'webuploader/core/runtime/html5/runtime'
        ], function( Base, Html5Runtime ) {

    var $ = Base.$,
        defaultOpts = {
            url: '',
            fileVar: 'file',
            crossDomain: false,

            formData: {},

            headers: {}
        };

    function Transport( opts ) {
        this.xhr = null;
        opts = this.options = $.extend( true, {}, defaultOpts, opts || {} );

        if ( !opts.crossDomain ) {
            opts.headers[ 'X-Requested-With' ] = 'XMLHttpRequest';
        }

        this.init();
    }

    $.extend( Transport.prototype, {
        state: 'pending',

        init: function() {
            var me = this,
                opts = me.options,
                xhr = new XMLHttpRequest(),
                formData = new FormData();

            opts.formData && $.each( opts.formData, function( key, val ) {
                formData.append( key, val );
            } );

            xhr.upload.onprogress = function( e ) {
                var percentage = 0;

                if ( e.lengthComputable ) {
                    percentage = Math.round( e.loaded * 100 / e.total );
                }

                me._notify( percentage );
            };

            xhr.onreadystatechange = function() {
                var ret, rHeaders, reject;

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                if ( xhr.status >= 200 && xhr.status < 300 ) {
                    ret = me._parseResponse( xhr.responseText );
                    rHeaders = me._getXhrHeaders( xhr );

                    me.trigger( 'accept', ret, rHeaders, function( reason ) {
                        reject = {
                            type: 'rejected',
                            msg: reason,
                            code: 0
                        };
                    } );

                    if ( !reject ) {
                        return me._resolve( ret, rHeaders );
                    }
                }

                reject = reject || {
                    type: 'http',
                    msg: xhr.statusText,
                    code: xhr.status
                };

                return me._reject( reject );
            };

            this.xhr = xhr;
            this.formData = formData;
        },

        _notify: function( percentage ) {
            this.state = 'progress';
            this.trigger( 'progress', percentage || 0 );
        },

        _resolve: function( ret, headers ) {
            this.state = 'done';
            this.trigger( 'complete', ret, headers );
        },

        _reject: function( reason ) {
            this.state = 'fail';
            this.trigger( 'error', reason );
        },

        _setRequestHeader: function( xhr, headers ) {
            $.each( headers, function( key, val ) {
                xhr.setRequestHeader( key, val );
            } );
        },

        _getXhrHeaders: function( xhr ) {
            var str = xhr.getAllResponseHeaders(),
                ret = {},
                match;


            $.each( str.split( /\n/ ), function( i, str ) {
                match = /^(.*?): (.*)$/.exec( str );
                if ( match ) {
                    ret[ match[ 1 ] ] = match[ 2 ];
                }
            } );

            return ret;
        },

        _parseResponse: function( json ) {
            var ret;

            try {
                ret = JSON.parse( json );
            } catch ( ex ) {
                ret = {};
            }

            return ret;
        },

        /**
         * 以Blob的方式发送数据到服务器
         * @method sendAsBlob
         * @param {Blob} blob Blob数据
         * @return {Transport} 返回实例自己，便于链式调用。
         * @chainable
         */
        sendAsBlob: function( blob ) {

            // 只有在pedding的时候才可以发送。
            if ( this.state !== 'pending' ) {
                return;
            }

            var opts = this.options,
                formData = this.formData,
                xhr = this.xhr;

            formData.append( opts.fileVar, blob );
            xhr.open( 'POST', opts.url );
            this._setRequestHeader( xhr, opts.headers );
            xhr.send( formData );
            this._notify( 0 );
            return this;
        },

        destroy: function() {
            var xhr = this.xhr;

            xhr.upload.onprogress = null;
            xhr.onreadystatechange = null;
            this.xhr = null;

            this.formData = null;
        }
    } );

    // 静态方法直接发送内容。
    Transport.sendAsBlob = function( blob, options ) {
        var instance = new Transport( options );
        instance.sendAsBlob( blob );
        return instance;
    };

    Html5Runtime.register( 'Transport', Transport );
} );