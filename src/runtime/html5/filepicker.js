/**
 * @fileOverview FilePicker
 * @import base.js, runtime/html5/runtime.js, lib/file.js
 */
define( 'webuploader/runtime/html5/filepicker', [
        'webuploader/base',
        'webuploader/runtime/html5/runtime',
        'webuploader/lib/file'
    ], function( Base, Html5Runtime, File ) {

        var $ = Base.$;

        return Html5Runtime.register( 'FilePicker', {
            init: function() {
                var owner = this.owner,
                    opts = owner.options,
                    elem = opts.container,
                    acceptStr = [],
                    extStr = [],
                    i, ii, len, label, input, inputId;

                inputId = 'btn' + Date.now();
                input = $( document.createElement( 'input' ) );
                label = $( document.createElement( 'label' ) );

                input.attr({
                    type: 'file',
                    id: inputId
                });
                // input.addClass( 'webuploader-btn-input' );


                label.addClass( 'webuploader-btn' );
                label.html( opts.btnName || elem.text() || '选择文件'  );
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
                        ruid = owner.getRuid(),
                        clone;

                    owner.trigger( 'select', $.map( e.target.files, function( file ) {
                        return new File( ruid, file );
                    }) );

                    // reset input
                    clone = this.cloneNode( true );
                    this.parentNode.replaceChild( clone, this );

                    input.off( 'change', fn );
                    $( clone ).on( 'change', fn );
                } );

                elem.empty().addClass( 'webuploader-pick' ).append( input );
                elem.append( label );
            },

            destroy: function() {
                // todo
            }
        } );
    } );