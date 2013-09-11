/**
 * @fileOverview Dnd
 */
define( 'webuploader/core/runtime/html5/dnd', [
        'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/core/runtime/html5/runtime'
    ], function( Base, Mediator, Html5Runtime ) {

        var $ = Base.$,
            defaultOpts = {
                id: '',

                accept: [{
                    title: 'image',
                    extensions: 'gif,jpg,bmp,jpeg'
                }]
            };

        function Dnd( opts ) {
            this.options = $.extend( {}, defaultOpts, opts );
        }

        $.extend( Dnd.prototype, {

            init: function() {
                var me = this,
                    opts = me.options,
                    elem = $( opts.id ),
                    triggerFiles = [];

                var isAcceptType = function( type ) {
                    var acceptStr = [],
                        _tmp = [],
                        len,
                        ii,
                        i;

                    if ( opts.accept && opts.accept.length > 0 ) {
                        for (i = 0, len = opts.accept.length; i < len; i++) {
                            _tmp = opts.accept[i].extensions.split( ',' );
                            for (ii = 0; ii < _tmp.length; ii++) {
                                acceptStr.push(  opts.accept[i].title + '/' + _tmp[ii] );
                            };
                        };
                        acceptStr = acceptStr.join(',');

                        if ( type != '' && acceptStr.indexOf( type ) > -1) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                };

                var traverseDirectoryTree = function( entry ) {
                    var dirReader,
                        i;

                    if ( entry.isDirectory ) {
                        dirReader = entry.createReader();
                        dirReader.readEntries( function( entries ) {

                            for ( i = 0; i < entries.length; i++ ) {

                                if ( entries[i].isFile ) {
                                    entries[i].file( function( file ) {
                                        if ( isAcceptType( file.type ) ) {
                                            triggerFiles.push( file );
                                        }
                                    }, function( fileError ) {
                                        console.log('fileError');
                                    } );
                                } else {
                                    triggerFiles.push( traverseDirectoryTree( entries[i] ) );
                                }

                            }

                        }, function( fileError ) {});
                    }
                };

                if ( !elem.length ) {
                    throw new Error( '找不到元素#' + opts.id );
                }

                elem.on( 'dragenter', function( e ) {
                    elem.addClass( 'webuploader-dnd-over' );
                } );

                elem.on( 'dragover', function( e ) {
                    e.stopPropagation();
                    e.preventDefault();
                    elem.addClass( 'webuploader-dnd-over' );
                } );

                elem.on( 'drop', function( e ) {
                    var dataTrans = e.dataTransfer,
                        files = e.dataTransfer.files,
                        _tmp,
                        len,
                        i;

                    e.stopPropagation();
                    e.preventDefault();

                    for (i = 0, len = files.length; i < len; i++) {
                        if ( files[i].type && isAcceptType( files[i].type ) ) {
                            triggerFiles.push( files[i] );
                        } else if ( dataTrans.items && dataTrans.items[i].webkitGetAsEntry ) {
                            //文件夹处理
                            traverseDirectoryTree( dataTrans.items[i].webkitGetAsEntry() );
                        }
                    };

                    me.trigger( 'drop', triggerFiles );
                    e.dataTransfer.clearData();
                    triggerFiles = [];
                    elem.removeClass( 'webuploader-dnd-over' );
                } );

                elem.on( 'dragleave', function( e ) {
                    elem.removeClass( 'webuploader-dnd-over' );
                } );
            }

        } );


        Html5Runtime.register( 'Dnd', Dnd );

        /* jshint camelcase:false */

        // 告诉Runtime，支持哪些能力
        // 这个方法会在选择时执行，好处是按需执行。
        Html5Runtime.addDetect(function() {
            // todo 需要运行时检测。

            return {

                // 是否能选择图片
                select_file: true,

                // 是否能多选
                select_multiple: true,

                // 是否支持文件过滤
                filter_by_extension: true
            };
        });

        return Dnd;
    } );