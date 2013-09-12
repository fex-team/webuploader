/**
 * @fileOverview 负责文件验证
 */
define( 'webuploader/core/validator', [ 'webuploader/base',
        'webuploader/core/mediator' ], function( Base, Mediator ) {

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
            max = opts.fileNumLimit >>> 0;

        if ( !max ) {
            return;
        }

        uploader.on( 'beforeFileQueued', function() {
            if ( count >= max ) {
                this.trigger( 'error', 'Q_EXCEED_NUM_LIMIT', max );
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
            max = opts.fileSizeLimit >>> 0;

        if ( !max ) {
            return;
        }

        uploader.on( 'beforeFileQueued', function( file ) {
            var invalid = count + file.size > max;
            if ( invalid ) {
                this.trigger( 'error', 'Q_EXCEED_SIZE_LIMIT', max );
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

    return api;
} );