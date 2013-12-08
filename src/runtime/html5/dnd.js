/**
 * @fileOverview FilePaste
 */
define([
    '/base',
    'runtime',
    '/lib/file'
], function( Base, Html5Runtime, File ) {

    var $ = Base.$;

    return Html5Runtime.register( 'DragAndDrop', {
        init: function() {
            var elem = this.elem = this.options.container;

            this.dragEnterHander = Base.bindFn( this._dragEnterHander, this );
            this.dragLeaveHander = Base.bindFn( this._dragLeaveHander, this );
            this.dropHander = Base.bindFn( this._dropHander, this );

            elem.on( 'dragenter', this.dragEnterHander );
            elem.on( 'dragover', this.dragEnterHander );
            elem.on( 'dragleave', this.dragLeaveHander );
            elem.on( 'drop', this.dropHander );
        },

        _dragEnterHander: function( e ) {
            this.elem.addClass('webuploader-dnd-over');
            e.stopPropagation();
            e.preventDefault();
        },

        _dragLeaveHander: function( e ) {
            this.elem.removeClass('webuploader-dnd-over');
            e.stopPropagation();
            e.preventDefault();
        },

        _dropHander: function( e ) {
            var results  = [],
                promises = [],
                me = this,
                ruid = me.getRuid(),
                items, files, dataTransfer, file, i, len, canAccessFolder;

            e.preventDefault();
            e.stopPropagation();

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

            this.elem.removeClass('webuploader-dnd-over');
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

            elem.on( 'dragenter', this.dragEnterHander );
            elem.on( 'dragover', this.dragEnterHander );
            elem.on( 'dragleave', this.dragLeaveHander );
            elem.on( 'drop', this.dropHander );
        }
    });
});