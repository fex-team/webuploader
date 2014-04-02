/**
 * @fileOverview FilePaste
 */
define([
    '../../base',
    './runtime',
    '../../lib/file'
], function( Base, Html5Runtime, File ) {

    return Html5Runtime.register( 'FilePaste', {
        init: function() {
            var opts = this.options,
                elem = this.elem = opts.container,
                accept = '.*',
                arr, i, len, item;

            // accetp的mimeTypes中生成匹配正则。
            if ( opts.accept ) {
                arr = [];

                for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                    item = opts.accept[ i ].mimeTypes;
                    item && arr.push( item );
                }

                if ( arr.length ) {
                    accept = arr.join(',');
                    accept = accept.replace( /,/g, '|' ).replace( /\*/g, '.*' );
                }
            }
            this.accept = accept = new RegExp( accept, 'i' );
            this.hander = Base.bindFn( this._pasteHander, this );
            elem.on( 'paste', this.hander );
        },

        _pasteHander: function( e ) {
            var allowed = [],
                ruid = this.getRuid(),
                items, item, blob, i, len;

            e = e.originalEvent || e;
            items = e.clipboardData.items;

            for ( i = 0, len = items.length; i < len; i++ ) {
                item = items[ i ];

                if ( item.kind !== 'file' || !(blob = item.getAsFile()) ) {
                    continue;
                }

                allowed.push( new File( ruid, blob ) );
            }

            if ( allowed.length ) {
                // 不阻止非文件粘贴（文字粘贴）的事件冒泡
                e.preventDefault();
                e.stopPropagation();
                this.trigger( 'paste', allowed );
            }
        },

        destroy: function() {
            this.elem.off( 'paste', this.hander );
        }
    });
});
