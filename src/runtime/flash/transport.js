/**
 * @fileOverview Image
 */
define([
    '/base',
    './runtime',
    '../target'
], function( Base, FlashRuntime, RuntimeTarget, Encode ) {

    var $ = Base.$;

    return FlashRuntime.register( 'Transport', {
        init: function( opts ) {

        },

        setFile: function( file ) {
            this.file = file;
        },

        // @todo ie支持
        _initAjax: function() {
            var me = this,
                opts = me.options,
                owner = me.owner,
                ruid = owner.getRuid(),
                xhr = new RuntimeTarget( 'XMLHttpRequest' );

            xhr.connectRuntime( ruid );

            xhr.on( 'uploadprogress', function( data ) {
                var percentage = data.loaded / data.total;
                return me._onprogress.call( me, percentage );
            });

            xhr.on( 'load', function() {
                var status = xhr.exec( 'getStatus' ),

                    // @todo
                    rHeaders = {},
                    target, reject, response, base64, ret;

                xhr.off();
                clearTimeout( me.timoutTimer );
                me._xhr = null;

                if ( status === 200 ) {
                    response = xhr.exec( 'getResponse' );
                    ret = me._parseResponse( response );
                    ret._raw = response;



                    // 说明server端返回的数据有问题。
                    if ( !owner.trigger( 'accept', ret, rHeaders,
                         function( val ) {
                        reject = val;
                    } ) ) {
                        reject = reject || 'server';
                    } else {
                        return me._onsuccess.call( me, ret, rHeaders );
                    }
                }

                reject = reject || (status ? 'http' : 'abort');
                return me._reject( reject, ret, rHeaders );
            });

            xhr.on( 'error', function() {
                xhr.off();
                clearTimeout( me.timoutTimer );
                me._xhr = null;
                me._reject( 'http' );
            });

            return me._xhr = xhr;
        },

        _onprogress: function( percentage ) {
            var opts = this.options,
                start, end, total;

            if ( this.chunks ) {
                total = this._blob.size;
                start = this.chunk * opts.chunkSize;
                end = Math.min( start + opts.chunkSize, total );

                percentage = (start + percentage * (end -start)) / total;
            }

            this._timeout();
            this._notify( percentage );
        },

        _onsuccess: function( ret, headers ) {
            if ( this.chunks && this.chunk < this.chunks - 1 ) {
                if ( !this.owner.trigger( 'chunkcontinue', ret, headers,
                     this.chunk, this.chunks ) ) {
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
                xhr.exec( 'setRequestHeader', key, val );
            } );
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

            var me = this,
                owner = me.owner,
                opts = owner.options,
                xhr = me._initAjax(),
                blob = me._blob,
                start, end;

            if ( me.chunks ) {
                start = me.chunk * opts.chunkSize;
                end = Math.min( blob.size, start + opts.chunkSize );

                blob = blob.slice( start, end );
                opts.formData.chunk = me.chunk;
                opts.formData.chunks = me.chunks;
            }

            // 外部可以在这个时机中添加其他信息
            owner.trigger( 'beforeSend', opts.formData, opts.headers );

            $.each( opts.formData, function( key, val ) {
                xhr.exec( 'append', key, val );
            } );

            xhr.exec( 'appendBlob', opts.fileVar, blob.uid, opts.formData &&
                    opts.formData.name || '' );

            me._setRequestHeader( xhr, opts.headers );
            me._timeout();

            xhr.exec( 'send', {
                method: opts.method,
                url: opts.server,
                transport: 'client'
            } );
            owner.state = 'progress';
            return this;
        },

        _timeout: function() {
            var me = this,
                duration = me.options.timeout;

            if ( duration ) {
                clearTimeout( me.timoutTimer );
                me.timoutTimer = setTimeout(function() {
                    me._xhr && me._xhr.exec( 'abort' );
                    me._reject('timeout');
                }, duration );
            }
        },

        pause: function( interrupt ) {
            if ( this.paused ) {
                return;
            }

            this.paused = true;
            interrupt && this.cancel();
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
                this._xhr.off();
                clearTimeout( this.timoutTimer );
                this._xhr.exec( 'abort' );
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
            var opts = this.owner.options,
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
});