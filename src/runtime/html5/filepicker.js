/**
 * @fileOverview FilePicker
 */
define([
    '../../base',
    './runtime'
], function( Base, Html5Runtime ) {

    var $ = Base.$;

    return Html5Runtime.register( 'FilePicker', {
        init: function() {
            var container = this.getRuntime().getContainer(),
                me = this,
                owner = me.owner,
                opts = me.options,
                label = this.label = $( document.createElement('label') ),
                input =  this.input = $( document.createElement('input') ),
                arr, i, len, mouseHandler;

            input.attr( 'type', 'file' );
            input.attr( 'name', opts.name );
            input.addClass('webuploader-element-invisible');

            label.on( 'click', function() {
                input.trigger('click');
            });

            label.css({
                opacity: 0,
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: 'pointer',
                background: '#ffffff'
            });

            if ( opts.multiple ) {
                input.attr( 'multiple', 'multiple' );
            }

            // @todo Firefox不支持单独指定后缀
            if ( opts.accept && opts.accept.length > 0 ) {
                arr = [];

                for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                    arr.push( opts.accept[ i ].mimeTypes );
                }

                input.attr( 'accept', arr.join(',') );
            }

            container.append( input );
            container.append( label );

            mouseHandler = function( e ) {
                owner.trigger( e.type );
            };

            input.on( 'change', function( e ) {
                var fn = arguments.callee,
                    clone;

                me.files = e.target.files;

                // reset input
                clone = this.cloneNode( true );
                clone.value = null;
                this.parentNode.replaceChild( clone, this );

                input.off();
                input = $( clone ).on( 'change', fn )
                        .on( 'mouseenter mouseleave', mouseHandler );

                owner.trigger('change');
            });

            label.on( 'mouseenter mouseleave', mouseHandler );

        },


        getFiles: function() {
            return this.files;
        },

        destroy: function() {
            this.input.off();
            this.label.off();
        }
    });
});