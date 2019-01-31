/**
 * @fileOverview Transport
 * @todo 支持chunked传输，优势：
 * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
 * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
 */
define([
    '../../base',
    './runtime'
], function( Base, Html5Runtime ) {

    var noop = Base.noop,
        $ = Base.$;

    return Html5Runtime.register( 'Transport', {
        init: function() {
            this._status = 0;
            this._response = null;
        },

        send: function() {
            var owner = this.owner,
                opts = this.options,
                xhr = this._initAjax(),
                blob = owner._blob,
                server = opts.server,
                formData, binary, fr;

            if ( opts.sendAsBinary ) {
                server += opts.attachInfoToQuery !== false ? ((/\?/.test( server ) ? '&' : '?') +
                        $.param( owner._formData )) : '';

                binary = blob.getSource();
            } else {
                formData = new FormData();
                $.each( owner._formData, function( k, v ) {
                    formData.append( k, v );
                });

                formData.append( opts.fileVal, blob.getSource(),
                        opts.filename || owner._formData.name || '' );
            }

            if ( opts.withCredentials && 'withCredentials' in xhr ) {
                xhr.open( opts.method, server, true );
                xhr.withCredentials = true;
            } else {
                xhr.open( opts.method, server );
            }

            this._setRequestHeader( xhr, opts.headers );

            if ( binary ) {
                // 强制设置成 content-type 为文件流。
                xhr.overrideMimeType &&
                        xhr.overrideMimeType('application/octet-stream');

                // android直接发送blob会导致服务端接收到的是空文件。
                // bug详情。
                // https://code.google.com/p/android/issues/detail?id=39882
                // 所以先用fileReader读取出来再通过arraybuffer的方式发送。
                if ( Base.os.android ) {
                    fr = new FileReader();

                    fr.onload = function() {
                        xhr.send( this.result );
                        fr = fr.onload = null;
                    };

                    fr.readAsArrayBuffer( binary );
                } else {
                    xhr.send( binary );
                }
            } else {
                xhr.send( formData );
            }
        },

        getResponse: function() {
            return this._response;
        },

        getResponseAsJson: function() {
            return this._parseJson( this._response );
        },

        getResponseHeaders: function() {
            return this._headers;
        },

        getStatus: function() {
            return this._status;
        },

        abort: function() {
            var xhr = this._xhr;

            if ( xhr ) {
                xhr.upload.onprogress = noop;
                xhr.onreadystatechange = noop;
                xhr.abort();

                this._xhr = xhr = null;
            }
        },

        destroy: function() {
            this.abort();
        },

        _parseHeader: function(raw) {
            var ret = {};

            raw && raw.replace(/^([^\:]+):(.*)$/mg, function(_, key, value) {
                ret[key.trim()] = value.trim();
            });

            return ret;
        },

        _initAjax: function() {
            var me = this,
                xhr = new XMLHttpRequest(),
                opts = this.options;

            if ( opts.withCredentials && !('withCredentials' in xhr) &&
                    typeof XDomainRequest !== 'undefined' ) {
                xhr = new XDomainRequest();
            }

            xhr.upload.onprogress = function( e ) {
                var percentage = 0;

                if ( e.lengthComputable ) {
                    percentage = e.loaded / e.total;
                }

                return me.trigger( 'progress', percentage );
            };

            xhr.onreadystatechange = function() {

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                xhr.upload.onprogress = noop;
                xhr.onreadystatechange = noop;
                me._xhr = null;
                me._status = xhr.status;

                var separator = '|', // 分隔符
                     // 拼接的状态，在 widgets/upload.js 会有代码用到这个分隔符
                    status = separator + xhr.status +
                             separator + xhr.statusText;

                if ( xhr.status >= 200 && xhr.status < 300 ) {
                    me._response = xhr.responseText;
                    me._headers = me._parseHeader(xhr.getAllResponseHeaders());
                    return me.trigger('load');
                } else if ( xhr.status >= 500 && xhr.status < 600 ) {
                    me._response = xhr.responseText;
                    me._headers = me._parseHeader(xhr.getAllResponseHeaders());
                    return me.trigger( 'error', 'server' + status );
                }


                return me.trigger( 'error', me._status ? 'http' + status : 'abort' );
            };

            me._xhr = xhr;
            return xhr;
        },

        _setRequestHeader: function( xhr, headers ) {
            $.each( headers, function( key, val ) {
                xhr.setRequestHeader( key, val );
            });
        },

        _parseJson: function( str ) {
            var json;

            try {
                json = JSON.parse( str );
            } catch ( ex ) {
                json = {};
            }

            return json;
        }
    });
});
