define( 'WebUploader/core/runtime/html5/FilePicker', [
        'WebUploader/Base',
        'WebUploader/core/Mediator',
        'WebUploader/core/runtime/html5/Runtime'
    ], function( Base, Mediator, Html5Runtime ) {

    var $ = Base.$,
        defaultOpts = {
            id: '',
            name: 'file',
            multiple: false,
            accept: {
                title: 'All Files',
                extensions: '*'
            }
        };

    function FilePicker( opts ) {
        this.options = $.extend( {}, defaultOpts, opts );
    }

    $.extend( FilePicker.prototype, {

        init: function() {
            var me = this,
                opts = me.options,
                elem = $( '#' + opts.id ),
                input;

            if ( !elem.length ) {
                throw new Error( '找不到元素#'+opts.id );
            }

            input = document.createElement( 'input' );

            if ( opts.multiple ) {
                input.setAttribute( 'multiple', 'multiple' );
            }

            if ( opts.accept ) {
                // input.setAttribute("accept", options.acceptFiles);
            }

            input.setAttribute( 'type', 'file' );
            input.setAttribute( 'name', opts.name );

            $( input ).on( 'change', function( e ) {
                me.trigger( 'select', e.target.files );
            } );

            elem.before( input );
        }

    } );


    Html5Runtime.register( 'FilePicker', FilePicker );

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
            filter_by_extension: true,
        };
    });

    return FilePicker;
} );