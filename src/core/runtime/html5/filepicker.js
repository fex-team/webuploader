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
                multiple: false,

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
                    elem = $( '#' + opts.id ),
                    i,
                    ii,
                    len,
                    acceptStr = [],
                    extStr = [],
                    label,
                    input;

                if ( !elem.length ) {
                    throw new Error( '找不到元素#' + opts.id );
                }

                input = document.createElement( 'input' );
                label = document.createElement( 'label' );
                input.setAttribute( 'type', 'file' );
                input.setAttribute( 'name', opts.name );
                input.setAttribute( 'id', opts.name );
                input.style.width = '0px';
                label.setAttribute( 'for', opts.name );
                label.className = 'webuploader-btn';
                label.innerHTML = '上传照片';

                if ( opts.multiple ) {
                    input.setAttribute( 'multiple', 'multiple' );
                }

                if ( opts.accept && opts.accept.length > 0 ) {
                    for (i = 0, len = opts.accept.length; i < len; i++) {
                        //acceptStr.push( opts.accept[i].title + '/' + opts.accept[i].extensions );
                        extStr = opts.accept[i].extensions.split( ',' );
                        for (var ii = 0; ii < extStr.length; ii++) {
                            acceptStr.push( opts.accept[i].title + '/' + extStr[ii] );
                        };
                    };
                    input.setAttribute( 'accept', acceptStr.join( ',' ) );
                }

                if ( opts.labelClass) {
                    label.className += ( ' ' + opts.labelClass );
                }

                $( input ).on( 'change', function( e ) {
                    me.trigger( 'select', e.target.files );
                } );

                $( label ).on( 'mouseover', function( e ) {
                    label.className += ' webuploader-btn-hover';
                } );

                $( label ).on( 'mouseout', function( e ) {
                    label.className = label.className.replace( ' webuploader-btn-hover', '' );
                } );

                elem.append( input );
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