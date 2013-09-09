// 此文件在worker环境下运行。
importScripts('md5.js');

var fr = new FileReader();

function md5File(file, cb) {
    var content;

    fr.onload = function() {
        content = md5( this.result );
    }

    fr.onloadend = function() {
        fr.onloadend = null;
        fr.onload = null;

        cb( content );
    }

    fr.readAsBinaryString( file );
}

onmessage = function( e ) {
    var file = e.data;
    md5File( file, function( ret ) {
        postMessage( ret );
    });
}