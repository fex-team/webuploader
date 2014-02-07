/**
 * @fileOverview FilePaste
 */
define([
    '../../base',
    './runtime',
    '../../lib/file'
], function( Base, Html5Runtime, File ) {

    var $ = Base.$;

    return Html5Runtime.register( 'DragAndDrop', {
        init: function() {
            var elem = this.elem = this.options.container;

            this.dragEnterHandler = Base.bindFn( this._dragEnterHandler, this );
            this.dragOverHandler = Base.bindFn( this._dragOverHandler, this );
            this.dragLeaveHandler = Base.bindFn( this._dragLeaveHandler, this );
            this.dropHandler = Base.bindFn( this._dropHandler, this );
            this.dndOver = false;

            elem.on( 'dragenter', this.dragEnterHandler );
            elem.on( 'dragover', this.dragOverHandler );
            elem.on( 'dragleave', this.dragLeaveHandler );
            elem.on( 'drop', this.dropHandler );

            if ( this.options.disableGlobalDnd ) {
                $( document ).on( 'dragover', this.dragOverHandler );
                $( document ).on( 'drop', this.dropHandler );
            }
        },

        _dragEnterHandler: function( e ) {
            this.dndOver = true;
            this.elem.addClass('webuploader-dnd-over');

            e = e.originalEvent || e;
            e.dataTransfer.dropEffect = 'copy';

            return false;
        },

        _dragOverHandler: function( e ) {
            // 只处理框内的。
            var parentElem = this.elem.parent().get( 0 );
            if ( parentElem && !$.contains( parentElem, e.target ) ) {
                return false;
            }

            this._dragEnterHandler.call( this, e );

            return false;
        },

        _dragLeaveHandler: function() {
            var me = this,
                handler = function() {
                    if ( !me.dndOver ) {
                        me.elem.removeClass('webuploader-dnd-over');
                    }
                };
            setTimeout( handler, 50 );
            this.dndOver = false;

            return false;
        },

        _dropHandler: function( e ) {
            var results  = [],
                promises = [],
                me = this,
                ruid = me.getRuid(),
                parentElem = me.elem.parent().get( 0 ),
                items, files, dataTransfer, file, i, len, canAccessFolder;

            // 只处理框内的。
            if ( parentElem && !$.contains( parentElem, e.target ) ) {
                return false;
            }

            e = e.originalEvent || e;
            dataTransfer = e.dataTransfer;
            items = dataTransfer.items;
            files = dataTransfer.files;

            canAccessFolder = !!(items && items[ 0 ].webkitGetAsEntry);

            for ( i = 0, len = files.length; i < len; i++ ) {
                file = files[ i ];
                if ( file.type ) {
                    results.push( file );
                } else if ( !file.type && canAccessFolder ) {
                    promises.push( this._traverseDirectoryTree(
                            items[ i ].webkitGetAsEntry(), results ) );
                }
            }

            Base.when.apply( Base, promises ).done(function() {
                me.trigger( 'drop', $.map( results, function( file ) {
                    return new File( ruid, file );
                }) );
            });

            this.dndOver = false;
            this.elem.removeClass('webuploader-dnd-over');
            return false;
        },

        _traverseDirectoryTree: function( entry, results ) {
            var deferred = Base.Deferred(),
                me = this;

            if ( entry.isFile ) {
                entry.file(function( file ) {
                    file.type && results.push( file );
                    deferred.resolve( true );
                });
            } else if ( entry.isDirectory ) {
                entry.createReader().readEntries(function( entries ) {
                    var len = entries.length,
                        promises = [],
                        arr = [],    // 为了保证顺序。
                        i;

                    for ( i = 0; i < len; i++ ) {
                        promises.push( me._traverseDirectoryTree(
                                entries[ i ], arr ) );
                    }

                    Base.when.apply( Base, promises ).then(function() {
                        results.push.apply( results, arr );
                        deferred.resolve( true );
                    }, deferred.reject );
                });
            }

            return deferred.promise();
        },

        destroy: function() {
            var elem = this.elem;

            elem.off( 'dragenter', this.dragEnterHandler );
            elem.off( 'dragover', this.dragEnterHandler );
            elem.off( 'dragleave', this.dragLeaveHandler );
            elem.off( 'drop', this.dropHandler );

            if ( this.options.disableGlobalDnd ) {
                $( document ).off( 'dragover', this.dragOverHandler );
                $( document ).off( 'drop', this.dropHandler );
            }
        }
    });
});
