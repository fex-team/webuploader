/**
 * @fileOverview 组件基类。
 * @import base.js, core/uploader.js, widgets/widget.js, lib/filepicker.js
 */
define('webuploader/widgets/filepicker', ['webuploader/base',
    'webuploader/core/uploader',
    'webuploader/lib/filepicker'
], function(Base, Uploader, FilePicker) {

    var $ = Base.$;

    $.extend(Uploader.options, {
        pick: {
            multiple: true,
            id: '#uploaderBtn'
        },

        accept: [{
            title: 'Images',
            extensions: 'gif,jpg,bmp,png',
            mimeTypes: 'image/*'
        }]
    });

    return Uploader.register({
            'add-btn': 'addButton',
            'refresh': 'refresh'
        },

        {
            init: function( opts ) {
                this.pickers = [];
                return opts.pick && this.addButton( opts.pick );
            },

            refresh: function() {
                $.each( this.pickers, function() {
                    this.refresh();
                });
            },

            addButton: function( pick ) {
                var me = this,
                    opts = me.options,
                    options, picker, deferred;

                if ( !pick ) {
                    return;
                }

                deferred = Base.Deferred();
                if (typeof pick === 'string') {
                    pick = {
                        id: pick
                    };
                }

                options = $.extend({}, pick, {
                    accept: opts.accept,
                    swf: opts.swf,
                    runtimeOrder: opts.runtimeOrder
                });

                picker = new FilePicker(options);

                picker.once('ready', deferred.resolve);
                picker.on('select', function(files) {
                    me.owner.request('add-file', [files]);
                });
                picker.init();

                this.pickers.push( picker );

                return deferred.promise();
            }
        });
});