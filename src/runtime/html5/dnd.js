/**
 * @fileOverview FilePaste
 */
define( 'webuploader/runtime/html5/dnd', [
        'webuploader/base'
    ], function( Base, Html5Runtime ) {

    var $ = Base.$;

    Html5Runtime.register( 'DragAndDrop', {
        init: function() {
            var me = this,
                opts = me.options,
                elem = opts.container,
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
                                    Base.log('fileError');
                                } );
                            } else {
                                triggerFiles.push( traverseDirectoryTree( entries[i] ) );
                            }

                        }

                    }, function( fileError ) {});
                }
            };

            elem.on( 'dragenter', function( e ) {
                elem.addClass( 'webuploader-dnd-over' );
            } );

            elem.on( 'dragover', function( e ) {
                e.stopPropagation();
                e.preventDefault();
                elem.addClass( 'webuploader-dnd-over' );
            } );

            elem.on( 'drop', function( e ) {
                var evt = e.originalEvent || e,
                    dataTrans = evt.dataTransfer,
                    files = evt.dataTransfer.files,
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
                evt.dataTransfer.clearData();
                triggerFiles = [];
                elem.removeClass( 'webuploader-dnd-over' );
            } );

            elem.on( 'dragleave', function( e ) {
                elem.removeClass( 'webuploader-dnd-over' );
            } );
        },

        destroy: function() {
            // todo
        }
    } );

    return true;
} );