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
        }
    });

    return Uploader.register({
            'add-btn': 'addButton'
        },

        {
            init: function(opts) {
                return opts.pick && this.addButton(opts.pick);
            },

            addButton: function(pick) {
                var me = this,
                    opts = me.options,
                    options, picker, deferred;

                if (!pick) {
                    return;
                }

                deferred = Base.Deferred();
                if (typeof pick === 'string') {
                    pick = {
                        container: pick
                    };
                }

                options = $.extend({}, pick, {
                    accept: opts.accept
                });

                options.container = options.id;
                picker = new FilePicker(options);

                picker.once('ready', deferred.resolve);
                picker.on('select', function(files) {
                    me.owner.request('add-file', [files]);
                });
                picker.init();

                return deferred.promise();
            }
        });
});