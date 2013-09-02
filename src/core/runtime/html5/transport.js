/**
 * @fileOverview Transport
 * @todo 支持chunked传输，优势：
 * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
 * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
 */
define( 'webuploader/core/runtime/html5/transport', [ 'webuploader/base',
        'webuploader/core/runtime/html5/runtime'
        ], function( Base, Html5Runtime ) {

    var $ = Base.$,
        defaultOpts = {
            url: '',
            fileVar: 'file',
            chunked: true,
            chunkSize: 1024 * 100,    // 1M.
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
    }

    $.extend( Transport.prototype, {
        state: 'pending',

        _initAjax: function() {
            var me = this,
                opts = me.options,
                xhr = new XMLHttpRequest();

            xhr.upload.onprogress = function( e ) {
                var percentage = 0;

                if ( e.lengthComputable ) {
                    percentage = Math.round( e.loaded / e.total );
                }

                return me._onprogress.call( me, percentage );
            };

            xhr.onreadystatechange = function() {
                var ret, rHeaders, reject;

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                xhr.upload.onprogress = null;
                xhr.onreadystatechange = null;
                me._xhr = null;

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
                        return me._oncomplete.call( me, ret, rHeaders );
                    }
                }

                reject = reject || {
                    type: 'http',
                    msg: xhr.statusText,
                    code: xhr.status
                };

                return me._reject( reject );
            };

            return me._xhr = xhr;
        },

        _onprogress: function( percentage ) {
            var opts = this.options,
                start, end, total;

            if ( this.chunks ) {
                start = this.chunk * opts.chunkSize;
                end = start + opts.chunkSize;
                total = this._blob.size;

                end = Math.min( end, total );

                percentage = (start + percentage * (end -start)) / total;
            }

            this._notify( percentage );
        },

        _oncomplete: function( ret, headers ) {
            if ( this.chunks && this.chunk < this.chunks - 1 ) {
                this.chunk++;
                this.paused || this._upload();
            } else {
                this._resolve( ret, headers );
            }
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

        _upload: function() {
            var opts = this.options,
                xhr = this._initAjax(),
                formData = new FormData(),
                blob = this._blob,
                start, end;

            if ( this.chunks ) {
                start = this.chunk * opts.chunkSize;
                end = start + opts.chunkSize;
                if ( end > blob.size ) {
                    end = blob.size;
                }

                blob = this._blob.slice( start, end );
                opts.formData.chunk = this.chunk;
                opts.formData.chunks = this.chunks;
                opts.headers[ 'Content-Range' ] = 'bytes ' + start +
                        '-' + end + '/' + this._blob.size;

                start === 0 &&
                        xhr.overrideMimeType( 'application/octet-stream' );
            }

            opts.formData && $.each( opts.formData, function( key, val ) {
                formData.append( key, val );
            } );

            formData.append( opts.fileVar, blob, this.filename );

            xhr.open( 'POST', opts.url );
            this._setRequestHeader( xhr, opts.headers );
            xhr.send( formData );
            return this;
        },

        pause: function() {
            this.paused = true;
            if ( this._xhr ) {
                this._xhr.abort();
                // this._onprogress( 0 );
            }
        },

        resume: function() {
            this.paused = false;
            if ( this.chunks && this.chunk < this.chunks - 1 ) {
                this._upload();
            }
        },

        abort: function() {
            if ( this.state === 'progress' ) {
                // @ todo
            }
        },

        /**
         * 以Blob的方式发送数据到服务器
         * @method sendAsBlob
         * @param {Blob} blob Blob数据
         * @return {Transport} 返回实例自己，便于链式调用。
         * @chainable
         */
        sendAsBlob: function( blob, filename ) {

            // 只有在pedding的时候才可以发送。
            if ( this.state !== 'pending' ) {
                return;
            }

            var opts = this.options;

            if ( opts.chunked && blob.size > opts.chunkSize ) {
                this.chunk = 0;
                this.chunks = Math.ceil( blob.size / opts.chunkSize );
            }

            this._blob = blob;
            this.filename = filename;

            this._upload();
            this._notify( 0 );
            return this;
        },

        destroy: function() {
            this._blob = null;
        }
    } );

    // 静态方法直接发送内容。
    Transport.sendAsBlob = function( blob, options, filename ) {
        if ( typeof options === 'string' ) {
            filename = options;
            options = {};
        } else if( options.filename ) {
            filename = options.filename;
        }

        var instance = new Transport( options );
        instance.sendAsBlob( blob, filename );
        return instance;
    };

    Html5Runtime.register( 'Transport', Transport );
} );