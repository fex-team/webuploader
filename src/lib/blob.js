/**
 * @fileOverview Blob
 */
define([
    '../base',
    '../runtime/client'
], function( Base, RuntimeClient ) {

    function Blob( ruid, source ) {
        var me = this;

        me.source = source;
        me.ruid = ruid;
        this.size = source.size || 0;

        // 如果没有指定 mimetype, 但是知道文件后缀。
        if ( !source.type && this.ext &&
                ~'jpg,jpeg,png,gif,bmp'.indexOf( this.ext ) ) {
            this.type = 'image/' + (this.ext === 'jpg' ? 'jpeg' : this.ext);
        } else {
            this.type = source.type || 'application/octet-stream';
        }

        RuntimeClient.call( me, 'Blob' );
        this.uid = source.uid || this.uid;

        if ( ruid ) {
            me.connectRuntime( ruid );
        }
    }

    Base.inherits( RuntimeClient, {
        constructor: Blob,

        slice: function( start, end ) {
            return this.exec( 'slice', start, end );
        },

        getSource: function() {
            return this.source;
        }
    });

    return Blob;
});