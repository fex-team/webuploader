/**
 * @fileOverview 各种验证，包括文件总大小是否超出、单文件是否超出和文件是否重复。
 */

define([
    'base',
    'uploader',
    'file',
    './widget'
], function( Base, Uploader, WUFile ) {

    var $ = Base.$,
        validators = {},
        api;

    // 暴露给外面的api
    api = {

        // 添加验证器
        addValidator: function( type, cb ) {
            validators[ type ] = cb;
        },

        // 移除验证器
        removeValidator: function( type ) {
            delete validators[ type ];
        }
    };

    // 在Uploader初始化的时候启动Validators的初始化
    Uploader.register({
        init: function() {
            var me = this;
            $.each( validators, function() {
                this.call( me.owner );
            });
        }
    });

    /**
     * @property {int} [fileNumLimit=undefined]
     * @namespace options
     * @for Uploader
     * @description 验证文件总数量, 超出则不允许加入队列。
     */
    api.addValidator( 'fileNumLimit', function() {
        var uploader = this,
            opts = uploader.options,
            count = 0,
            max = opts.fileNumLimit >> 0,
            flag = true;

        if ( !max ) {
            return;
        }

        uploader.on( 'beforeFileQueued', function() {

            if ( count >= max && flag ) {
                flag = false;
                this.trigger( 'error', 'Q_EXCEED_NUM_LIMIT', max );
                setTimeout(function() {
                    flag = true;
                }, 1 );
            }

            return count >= max ? false : true;
        });

        uploader.on( 'fileQueued', function() {
            count++;
        });

        uploader.on( 'fileDequeued', function() {
            count--;
        });
    });


    /**
     * @property {int} [fileSizeLimit=undefined]
     * @namespace options
     * @for Uploader
     * @description 验证文件总大小是否超出限制, 超出则不允许加入队列。
     */
    api.addValidator( 'fileSizeLimit', function() {
        var uploader = this,
            opts = uploader.options,
            count = 0,
            max = opts.fileSizeLimit >> 0,
            flag = true;

        if ( !max ) {
            return;
        }

        uploader.on( 'beforeFileQueued', function( file ) {
            var invalid = count + file.size > max;

            if ( invalid && flag ) {
                flag = false;
                this.trigger( 'error', 'Q_EXCEED_SIZE_LIMIT', max );
                setTimeout(function() {
                    flag = true;
                }, 1 );
            }

            return invalid ? false : true;
        });

        uploader.on( 'fileQueued', function( file ) {
            count += file.size;
        });

        uploader.on( 'fileDequeued', function( file ) {
            count -= file.size;
        });
    });

    /**
     * @property {int} [fileSingleSizeLimit=undefined]
     * @namespace options
     * @for Uploader
     * @description 验证单个文件大小是否超出限制, 超出则不允许加入队列。
     */
    api.addValidator( 'fileSingleSizeLimit', function() {
        var uploader = this,
            opts = uploader.options,
            max = opts.fileSingleSizeLimit;

        if ( !max ) {
            return;
        }

        uploader.on( 'fileQueued', function( file ) {
            if ( file.size > max ) {
                file.setStatus( WUFile.Status.INVALID, 'exceed_size' );
            }
        });
    });

    /**
     * @property {int} [duplicate=undefined]
     * @namespace options
     * @for Uploader
     * @description 去重， 根据文件名字、文件大小和最后修改时间来生成hash Key.
     */
    api.addValidator( 'duplicate', function() {
        var uploader = this,
            opts = uploader.options,
            mapping = {};

        if ( opts.duplicate ) {
            return;
        }

        function hashString( str ) {
            var hash = 0,
                i = 0,
                len = str.length,
                _char;

            for ( ; i < len; i++ ) {
                _char = str.charCodeAt( i );
                hash = _char + (hash << 6) + (hash << 16) - hash;
            }

            return hash;
        }

        uploader.on( 'beforeFileQueued', function( file ) {
            var hash = hashString( file.name + file.size +
                    file.lastModifiedDate );

            // 已经重复了
            if ( mapping[ hash ] ) {
                return false;
            }
        });

        uploader.on( 'fileQueued', function( file ) {
            var hash = hashString( file.name + file.size +
                    file.lastModifiedDate );

            mapping[ hash ] = true;
        });

        uploader.on( 'fileDequeued', function( file ) {
            var hash = hashString( file.name + file.size +
                    file.lastModifiedDate );

            delete mapping[ hash ];
        });
    });

    return api;
});