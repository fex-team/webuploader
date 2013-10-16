/**
 * @fileOverview FilePicker
 */
define( 'webuploader/core/runtime/html5/filepicker', [
        'webuploader/base'
    ], function( Base, Html5Runtime ) {

        var $ = Base.$;

        Html5Runtime.register( 'FilePicker', {
            init: function() {
                var me = this,
                    opts = me.options,
                    elem = $( opts.container ),
                    i,
                    ii,
                    len,
                    acceptStr = [],
                    extStr = [],
                    label,
                    input,
                    inputId;

                inputId = 'btn' + Date.now();
                input = $( document.createElement( 'input' ) );
                label = $( document.createElement( 'label' ) );

                input.attr({
                    type: 'file',
                    id: inputId
                });
                // input.addClass( 'webuploader-btn-input' );


                label.addClass( 'webuploader-btn' );
                label.html( opts.label );
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

                elem.empty().addClass( 'webuploader-pick' ).append( input );
                elem.append( label );
            },

            destroy: function() {
                // todo
            }
        } );

        return FilePicker;
    } );