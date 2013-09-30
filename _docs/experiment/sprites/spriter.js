(function(obj) {
    var Spriter = window.Spriter = function() {
        this.init();
    }

    var URL = obj.webkitURL || obj.mozURL || obj.URL;

    Spriter.prototype = {
        init: function() {
            this.offsetY = 0;
            this.indexOfAdded = 0;
            this.numOfPrepared = 0;
            this.maxWidth = 0;
            this.totalHeight = 0;
            this.files = [];
            this.images = [];
            this.canvas = document.createElement( 'canvas' );
            this.canvasCtx = this.canvas.getContext( '2d' );
        },
        add: function( files, start, done ) {
            this.files = files;
            this.done = done;

            start && start();

            this.prepare();
        },
        prepare: function() {
            var file = this.files[ this.numOfPrepared ],
                me = this;

            if( !file ) {
                this.images.length && this.draw();
                return;
            }

            var img = new Image(),
                src = URL.createObjectURL( file );

            img.onload = function() {
                URL.revokeObjectURL( img.src );
                me.numOfPrepared++;
                me.maxWidth = Math.max( me.maxWidth, img.width );
                img._spriteY = me.totalHeight;
                me.images.push( img );
                me.totalHeight += img.height;

                me.prepare();
            }

            img.src = src;
        },
        draw: function() {
            this.canvas.width = this.maxWidth;
            this.canvas.height = this.totalHeight;

            console.log( 'start draw @width: ' + this.maxWidth + 
                    ' @height: ' + this.totalHeight );

            for( var i = 0, len = this.images.length; i < len; i++ ) {
                var img = this.images[ i ];
                this.canvasCtx.drawImage( img, 0, img._spriteY );
            }

            if ( this.done ) {
                this.done( this.canvas );
            }

            // this.clear();
        },
        clear: function() {
            this.offsetY = 0;
            this.indexOfAdded = 0;
            this.numOfPrepared = 0;
            this.maxWidth = 0;
            this.totalHeight = 0;
            this.files = [];
            this.images = [];
            this.canvasCtx.clearRect( 
                0,
                0, 
                this.canvasCtx.canvas.width,
                this.canvasCtx.canvas.height
            );
        }
    };
})(this);