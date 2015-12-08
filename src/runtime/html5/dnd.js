/**
 * @fileOverview FilePaste
 */
define([
    '../../base',
    './runtime',
    '../../lib/file'
], function( Base, Html5Runtime, File ) {

    var $ = Base.$,
        prefix = 'webuploader-dnd-';

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
            var me = this,
                denied = me._denied || false,
                items;

            e = e.originalEvent || e;

            if ( !me.dndOver ) {
                me.dndOver = true;

                // 注意只有 chrome 支持。
                items = e.dataTransfer.items;

                if ( items && items.length ) {
                    me._denied = denied = !me.trigger( 'accept', items );
                }

                me.elem.addClass( prefix + 'over' );
                me.elem[ denied ? 'addClass' :
                        'removeClass' ]( prefix + 'denied' );
            }

            e.dataTransfer.dropEffect = denied ? 'none' : 'copy';

            return false;
        },

        _dragOverHandler: function( e ) {
            // 只处理框内的。
            var parentElem = this.elem.parent().get( 0 );
            if ( parentElem && !$.contains( parentElem, e.currentTarget ) ) {
                return false;
            }

            clearTimeout( this._leaveTimer );
            this._dragEnterHandler.call( this, e );

            return false;
        },

        _dragLeaveHandler: function() {
            var me = this,
                handler;

            handler = function() {
                me.dndOver = false;
                me.elem.removeClass( prefix + 'over ' + prefix + 'denied' );
            };

            clearTimeout( me._leaveTimer );
            me._leaveTimer = setTimeout( handler, 100 );
            return false;
        },

        _dropHandler: function( e ) {
            var me = this,
                ruid = me.getRuid(),
                parentElem = me.elem.parent().get( 0 ),
                dataTransfer, data;

            // 只处理框内的。
            if ( parentElem && !$.contains( parentElem, e.currentTarget ) ) {
                return false;
            }

            e = e.originalEvent || e;
            dataTransfer = e.dataTransfer;

            // 如果是页面内拖拽，还不能处理，不阻止事件。
            // 此处 ie11 下会报参数错误，
            try {
                data = dataTransfer.getData('text/html');
            } catch( err ) {
            }

            me.dndOver = false;
            me.elem.removeClass( prefix + 'over' );

            if ( !dataTransfer || data ) {
                return;
            }

            me._getTansferFiles( dataTransfer, function( results ) {
                me.trigger( 'drop', $.map( results, function( file ) {
                    return new File( ruid, file );
                }) );
            });

            return false;
        },

        // 如果传入 callback 则去查看文件夹，否则只管当前文件夹。
        _getTansferFiles: function( dataTransfer, callback ) {
            var results  = [],
                promises = [],
                items, files, file, item, i, len, canAccessFolder;

            items = dataTransfer.items;
            files = dataTransfer.files;

            canAccessFolder = !!(items && items[ 0 ].webkitGetAsEntry);

            for ( i = 0, len = files.length; i < len; i++ ) {
                file = files[ i ];
                item = items && items[ i ];

                if ( canAccessFolder && item.webkitGetAsEntry().isDirectory ) {

                    promises.push( this._traverseDirectoryTree(
                            item.webkitGetAsEntry(), results ) );
                } else {
                    results.push( file );
                }
            }

            Base.when.apply( Base, promises ).done(function() {

                if ( !results.length ) {
                    return;
                }

                callback( results );
            });
        },

        _traverseDirectoryTree: function( entry, results ) {
            var deferred = Base.Deferred(),
                me = this;

            if ( entry.isFile ) {
                entry.file(function( file ) {
                    results.push( file );
                    deferred.resolve();
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
                        deferred.resolve();
                    }, deferred.reject );
                });
            }

            return deferred.promise();
        },

        destroy: function() {
            var elem = this.elem;

            // 还没 init 就调用 destroy
            if (!elem) {
                return;
            }

            elem.off( 'dragenter', this.dragEnterHandler );
            elem.off( 'dragover', this.dragOverHandler );
            elem.off( 'dragleave', this.dragLeaveHandler );
            elem.off( 'drop', this.dropHandler );

            if ( this.options.disableGlobalDnd ) {
                $( document ).off( 'dragover', this.dragOverHandler );
                $( document ).off( 'drop', this.dropHandler );
            }
        }
    });
});
