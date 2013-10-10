/**
 * @fileOverview FilePicker
 */
define( 'webuploader/core/runtime/html5/filepicker', [
        'webuploader/base',
        'webuploader/core/mediator',
        'webuploader/core/runtime/html5/runtime'
    ], function( Base, Mediator, Html5Runtime ) {

        var $ = Base.$,
            defaultOpts = {
                id: '',
                name: 'file',
                multiple: true,

                accept: [{
                    title: 'image',
                    extensions: 'gif,jpg,bmp'
                }]
            };

        function FilePicker( opts ) {
            this.options = $.extend( {}, defaultOpts, opts );
        }

        $.extend( FilePicker.prototype, {

            init: function() {
                var me = this,
                    opts = me.options,
                    elem = $( opts.id ),
                    i,
                    ii,
                    len,
                    acceptStr = [],
                    extStr = [],
                    label,
                    input,
                    inputId;

                if ( !elem.length ) {
                    throw new Error( '找不到元素#' + opts.id );
                }

                inputId = opts.name ? opts.name : ( 'btn' + Date.now() );
                input = $( document.createElement( 'input' ) );
                label = $( document.createElement( 'label' ) );

                input.attr({
                    type: 'file',
                    id: inputId
                });
                // input.addClass( 'webuploader-btn-input' );


                label.addClass( 'webuploader-btn' );
                label.html( opts.btnName || elem.text() || '选择文件' );
                label.attr( 'for', inputId );

                if ( opts.multiple ) {
                    input.attr( 'multiple', 'multiple' );
                }

                if ( opts.accept && opts.accept.length > 0 ) {
                    for (i = 0, len = opts.accept.length; i < len; i++) {
                        extStr = opts.accept[i].extensions.split( ',' );
                        for (var ii = 0; ii < extStr.length; ii++) {
                            acceptStr.push( opts.accept[i].title + '/' + extStr[ii] );
                        };
                    };
                    input.attr( 'accept', acceptStr.join( ',' ) );
                }

                if ( opts.btnClass) {
                    label.addClass( opts.btnClass );
                }

                input.on( 'change', function( e ) {
                    var fn = arguments.callee,
                        clone;

                    me.trigger( 'select', e.target.files );


                    // reset input
                    clone = this.cloneNode( true );
                    this.parentNode.replaceChild( clone, this );

                    input.off( 'change', fn );
                    $( clone ).on( 'change', fn );
                } );

                // label.on( 'mouseover', function( e ) {
                //     label.addClass( 'webuploader-btn-hover' );
                // } );

                // label.on( 'mouseout', function( e ) {
                //     label.removeClass( 'webuploader-btn-hover' );
                // } );

                elem.empty().addClass( 'webuploader-pick' ).append( input );
                elem.append( label );
            }


        } );


        Html5Runtime.register( 'FilePicker', FilePicker );

        /* jshint camelcase:false */

        // 告诉Runtime，支持哪些能力
        // 这个方法会在选择时执行，好处是按需执行。
        Html5Runtime.addDetect(function() {
            // todo 需要运行时检测。

            return {

                // 是否能选择图片
                selectFile: true,

                // 是否能多选
                selectMultiple: true,

                // 是否支持文件过滤
                filteByExtension: true
            };
        });

        return FilePicker;
    } );