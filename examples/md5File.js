// 此文件在worker环境下运行。
importScripts('md5.js');

var fr = new FileReader();

var Md5File = (function() {
    /*var throttle = 3,
        pool = [],
        wating = [];

    function _tick() {
        var avaibles = [],
            i, fr, cb;

        for ( i = 0; i < throttle; i++ ) {
            fr = pool[ i ];
            fr && fr.readyState === 2 && avaibles.push( fr );
        }

        while ( avaibles.length && wating.length ) {
            fr = avaibles.shift();
            cb = wating.shift();
            fr.onload = fr.onerror = null;
            cb( fr );
            fr.onloadend = _tick;
        }
    }

    function getReader( cb ) {
        var fr;

        if ( pool.length < throttle ) {
            fr = new FileReader();
            pool.push( fr );
            cb( fr );
            fr.onloadend = _tick;
            return;
        }

        wating.push( cb );
        _tick();
    }*/

    return function( file, cb ) {
        var reader = new FileReader();

        reader.onload = function() {
            cb( md5( this.result ) );
            reader.onload = reader.onerror = null;

            reader.readAsBinaryString( new Blob() );
            reader = null;
        };

        reader.onerror = function( e ) {
            reader = reader.onload = reader.onerror = null;
        };

        reader.readAsBinaryString( file );
    }
})();

onmessage = function( e ) {
    var file = e.data;
    Md5File( file, function( ret ) {
        postMessage( ret );
    });
}