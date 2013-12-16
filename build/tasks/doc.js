module.exports = function( grunt ) {
    var Doc = require( 'gmudoc/lib/doc.js' );


    grunt.registerTask( 'doc', function() {
        var opts = this.options({
                cwd: '',
                files: [],
                theme: 'gmu',
                outputDir: './doc'
            }),
            done = this.async();


        var ins = new Doc( opts );

        ins.run( done );
    });
};