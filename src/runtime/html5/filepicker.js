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
                var container = this.getRuntime().getContainer(),
                    me = this,
                    owner = me.owner,
                    opts = me.options,
                    input = $( document.createElement( 'input' ) ),
                    arr, i, len, mouseHandler;

                input.attr( 'type', 'file' );

                input.css({
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: 'pointer'
                });

                if ( opts.multiple ) {
                    input.attr( 'multiple', 'multiple' );
                }

                if ( opts.accept && opts.accept.length > 0 ) {
                    arr = [];

                    for (i = 0, len = opts.accept.length; i < len; i++) {
                        arr.push( opts.accept[i].mimeTypes );
                    };

                    input.attr( 'accept', arr.join( ',' ) );
                }

                container.append( input );

                mouseHandler = function( e ) {
                    owner.trigger( e.type );
                };

                input.on( 'change', function( e ) {
                    var fn = arguments.callee,
                        ruid = owner.getRuid(),
                        clone;

                    me.files = e.target.files;

                    // reset input
                    clone = this.cloneNode( true );
                    this.parentNode.replaceChild( clone, this );

                    input.off();
                    $( clone ).on( 'change', fn ).on( 'mouseenter mouseleave', mouseHandler);

                    owner.trigger( 'change' );
                } );

                input.on( 'mouseenter mouseleave', mouseHandler );

            },


            getFiles: function() {
                return this.files;
            },

            destroy: function() {
                // todo
            }
        } );
    } );