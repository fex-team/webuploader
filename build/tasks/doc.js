module.exports = function( grunt ) {
    grunt.registerTask( 'doc', '生成文档', function() {
        var Doc = require( 'gmudoc/lib/doc.js' );

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