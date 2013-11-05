importScripts('jkm_md5.js');

function readContent(file, cb) {
	var chunkSize = 2 * 1024 * 1024,
		chunks = Math.ceil(file.size / chunkSize),
		chunk = 0,
		fr = new FileReader,
		ret = '',
		blobSlice = file.mozSlice || file.webkitSlice || file.slice,
		loadNext;

	loadNext = function() {
		var start, end;

		start = chunk * chunkSize;
		end = start + chunkSize >= file.size ? file.size : start + chunkSize;

		fr.onload = function() {
			ret += fr.result;
		};

		fr.onloadend = function() {
			fr.onload = fr.onloadend = null;

			if (++chunk < chunks) {
				loadNext();
			} else {
				blobSlice = file = null;
				cb(ret);
				ret = '';
			}
		};

		fr.readAsBinaryString(blobSlice.call(file, start, end));
	};

	loadNext();
}


onmessage = function( e ) {
    var file = e.data;
    
    postMessage( 'start read' );
    readContent( file, function( ret ) {
    	var hash;
    	postMessage( 'end read' );

    	postMessage( 'start md5' );
    	hash = md5( ret );
    	postMessage( 'end md5' );

        postMessage( hash );
        ret = hash = '';
    });
}