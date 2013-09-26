/**
 * @fileOverview 负责文件验证
 */
define( 'webuploader/core/validator', [ 'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/core/file' ], function( Base, Mediator, File ) {

    var $ = Base.$,
        validators = {},
        api;

    api = {
        addValidator: function( type, cb ) {
            validators[ type ] = cb;
        },

        removeValidator: function( type ) {
            delete validators[ type ];
        }
    };

    Mediator.on( 'uploaderInit', function( uploader ) {
        $.each( validators, function() {
            this.call( uploader );
        } );
    } );

    // 验证文件数量
    api.addValidator( 'fileNumLimit', function() {
        var uploader = this,
            opts = uploader.options,
            count = 0,
            max = opts.fileNumLimit >>> 0,
            flag = true;

        if ( !max ) {
            return;
        }

        uploader.on( 'beforeFileQueued', function() {
            if ( count >= max && flag ) {
                flag = false;
                this.trigger( 'error', 'Q_EXCEED_NUM_LIMIT', max );
                setTimeout( function() {
                    flag = true;
                }, 1 );
            }

            return count >= max ? false : true;
        } );

        uploader.on( 'fileQueued', function() {
            count++;
        } );

        uploader.on( 'fileDequeued', function() {
            count--;
        } );
    } );


    // 验证文件大小
    api.addValidator( 'fileSizeLimit', function() {
        var uploader = this,
            opts = uploader.options,
            count = 0,
            max = opts.fileSizeLimit >>> 0,
            flag = true;

        if ( !max ) {
            return;
        }

        uploader.on( 'beforeFileQueued', function( file ) {
            var invalid = count + file.size > max;
            if ( invalid && flag ) {
                flag = false;
                this.trigger( 'error', 'Q_EXCEED_SIZE_LIMIT', max );
                setTimeout( function() {
                    flag = true;
                }, 1 );
            }

            return invalid ? false : true;
        } );

        uploader.on( 'fileQueued', function( file ) {
            count += file.size;
        } );

        uploader.on( 'fileDequeued', function() {
            count -= file.size;
        } );
    } );

    // 当个文件不能超过50M
    api.addValidator( 'fileSingleSizeLimit', function() {
        var uploader = this,
            opts = uploader.options,
            max = opts.fileSingleSizeLimit;

        if ( !max ) {
            return;
        }

        uploader.on( 'fileQueued', function( file ) {
            if ( file.size > max ) {
                file.setStatus( File.Status.INVALID, 'exceed_size' );
            }
        } );
    } );

    // 去重
    api.addValidator( 'duplicate', function() {
        var uploader = this,
            opts = uploader.options,
            mapping = {};

        if ( opts.duplicate ) {
            return;
        }

        function hashString( str ) {
            var hash = 0,
                i =0,
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
        } );

        uploader.on( 'fileQueued', function( file ) {
            var hash = hashString( file.name + file.size +
                    file.lastModifiedDate );

            mapping[ hash ] = true;
        } );

        uploader.on( 'fileDequeued', function( file ) {
            var hash = hashString( file.name + file.size +
                    file.lastModifiedDate );

            delete mapping[ hash ];
        } );
    } );

    return api;
} );