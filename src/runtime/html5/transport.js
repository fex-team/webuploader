/**
 * @fileOverview Transport
 * @todo 支持chunked传输，优势：
 * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
 * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
 * @import base.js, runtime/html5/runtime.js
 */
define( 'webuploader/runtime/html5/transport', [ 'webuploader/base',
        'webuploader/runtime/html5/runtime'
        ], function( Base, Html5Runtime ) {

    var noop = Base.noop;

    return Html5Runtime.register( 'Transport', {
        setFile: function( file ) {
            this.file = file;
        },

        // @todo ie支持
        _initAjax: function() {
            var me = this,
                owner = this.owner,
                opts = owner.options,
                xhr = new XMLHttpRequest();

            if ( !('withCredentials' in xhr) &&
                    typeof XDomainRequest !== 'undefined' ) {
                xhr = new XDomainRequest();
            }

            xhr.upload.onprogress = function( e ) {
                var percentage = 0;

                if ( e.lengthComputable ) {
                    percentage = e.loaded / e.total;
                }

                return me._onprogress.call( me, percentage );
            };

            xhr.onreadystatechange = function() {
                var ret, rHeaders, reject;

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                xhr.upload.onprogress = noop;
                xhr.onreadystatechange = noop;
                clearTimeout( me.timoutTimer );
                me._xhr = null;

                // 只考虑200的情况
                if ( xhr.status === 200 ) {
                    ret = me._parseResponse( xhr.responseText );
                    ret._raw = xhr.responseText;
                    rHeaders = me._getXhrHeaders( xhr );

                    // 说明server端返回的数据有问题。
                    if ( !owner.trigger( 'accept', ret, rHeaders, function( val ) {
                        reject = val;
                    } ) ) {
                        reject = reject || 'server';
                    } else {
                        return me._onsuccess.call( me, ret, rHeaders );
                    }
                }

                reject = reject || (xhr.status ? 'http' : me.isTimeout ? 'timeout': 'abort');
                return me._reject( reject, ret, rHeaders );
            };

            return me._xhr = xhr;
        },

        _onprogress: function( percentage ) {
            var opts = this.owner.options,
                start, end, total;

            if ( this.chunks ) {
                total = this._blob.size;
                start = this.chunk * opts.chunkSize;
                end = Math.min( start + opts.chunkSize, total );

                percentage = (start + percentage * (end -start)) / total;
            }

            this._notify( percentage );
        },

        _onsuccess: function( ret, headers ) {
            if ( this.chunks && this.chunk < this.chunks - 1 ) {
                if ( !this.owner.trigger( 'chunkcontinue', ret, headers, this.chunk,
                        this.chunks ) ) {
                    return this._resolve( ret, headers );
                }
                this.chunk++;
                this._upload();
            } else {
                this._resolve( ret, headers );
            }
        },

        _notify: function( percentage ) {
            this.owner.trigger( 'progress', percentage || 0 );
        },

        _resolve: function( ret, headers ) {
            var owner = this.owner;

            this.chunks = 0;
            this._onprogress( 1 );
            owner.state = 'done';
            owner.trigger( 'success', ret, headers );
            owner.trigger( 'complete' );
        },

        _reject: function( reason, ret, rHeaders ) {
            var owner = this.owner;

            // @todo
            // 如果是timeout abort, 在chunk传输模式中应该自动重传。
            // chunkRetryCount = 3;
            owner.state = 'fail';
            owner.trigger( 'error', reason, ret, rHeaders );
            owner.trigger( 'complete' );
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
            if ( this.paused ) {
                return this;
            }

            var me = this,
                owner = me.owner,
                opts = me.options,
                xhr = this._initAjax(),
                formData = new FormData(),
                blob = this._blob,
                start, end;

            if ( this.chunks ) {
                start = this.chunk * opts.chunkSize;
                end = Math.min( blob.size, start + opts.chunkSize );

                blob = blob.slice( start, end );
                opts.formData.chunk = this.chunk;
                opts.formData.chunks = this.chunks;

                start === 0 &&
                        xhr.overrideMimeType( 'application/octet-stream' );
            }

            // 外部可以在这个时机中添加其他信息
            owner.trigger( 'beforeSend', opts.formData, opts.headers, xhr );

            $.each( opts.formData, function( key, val ) {
                formData.append( key, val );
            } );

            formData.append( opts.fileVar, blob.getSource(), opts.formData &&
                    opts.formData.name || '' );

            if ( opts.withCredentials && 'withCredentials' in xhr ) {
                xhr.open( 'POST', opts.server, true );
                xhr.withCredentials = true;
            } else {
                xhr.open( 'POST', opts.server );
            }

            this._setRequestHeader( xhr, opts.headers );

            me.isTimeout = false;
            if ( opts.timeout ) {
                this.timoutTimer = setTimeout(function() {
                    me.isTimeout = true;
                    xhr.abort();
                }, opts.timeout );
            }

            xhr.send( formData );
            owner.state = 'progress';
            return this;
        },

        pause: function( interupt ) {
            if ( this.paused ) {
                return;
            }

            this.paused = true;
            interupt && this.cancel();
        },

        resume: function() {
            if ( !this.paused ) {
                return;
            }

            this.paused = false;
            this._upload();
        },

        cancel: function() {
            if ( this._xhr ) {
                this._xhr.upload.onprogress = noop;
                this._xhr.onreadystatechange = noop;
                clearTimeout( this.timoutTimer );
                this._xhr.abort();
                this._xhr = null;
            }
        },

        /**
         * 以Blob的方式发送数据到服务器
         * @method sendAsBlob
         * @param {Blob} blob Blob数据
         * @return {Transport} 返回实例自己，便于链式调用。
         * @chainable
         */
        start: function() {
            var opts = this.options,
                blob = this.file.source;

            if ( opts.chunked && blob.size > opts.chunkSize ) {
                this.chunk = 0;
                this.chunks = Math.ceil( blob.size / opts.chunkSize );
            }
            this._blob = blob;

            this._upload();
            this._notify( 0 );
            return this;
        },

        destroy: function() {
            this._blob = null;
        }
    } );
} );