onmessage = function resizer( evt ) {
	var data = evt.data,
		file = data.file,
		type = file.type,
		maxWidth = data.maxWidth || 0,
		maxHeight = data.maxHeight || 0,
		quality = data.quality || 90,
		fr = new FileReader();

	fr.onload = function( e ){
		var img = new Image();
		img.onload = function(){
			var	w = img.width,
				h = img.height,
				r = w / h,
				targetWidth,
				targetHeight,
				result;

			if ( !maxWidth ) {
				targetHeight = Math.min( maxHeight, h );
				targetWidth = targetHeight * r;
			}
			else if ( !maxHeight ) {
				targetWidth = Math.min( maxWidth, w );
				targetHeight = targetWidth / r;
			}

			var canvas = document.createElement( 'canvas' );
		    canvas.width = targetWidth;
		    canvas.height = targetHeight;

		    var ctx = canvas.getContext( '2d' );
		    ctx.drawImage( img, 0, 0, targetWidth, targetHeight );

		    if ( type === 'image/jpeg') {
		    	result = canvas.toDataURL( 'image/jpeg', quality/100 );
		    }
		    else {
		    	result = canvas.toDataURL( 'image/png' );
		    }

			ctx.clearRect( 0, 0, canvas.width, canvas.height );
			canvas.width = canvas.height = 0;
			canvas = null;
			img = null;
			postMessage( result );
		};

		img.src = e.target.result;
	};

	fr.readAsDataURL( file );
}