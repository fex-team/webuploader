/**
 * @fileOverview 负责合并amd modules为一个单文件。
 */

'use strict';

var requirejs = require('requirejs'),
    fs = require('fs'),
    path = require('path');

// convert relative path to absolute path.
function convert( name, _path, contents ) {
    var rDefine = /(define\s*\(\s*('|").*?\2\s*,\s*\[)([\s\S]*?)\]/ig,
        rDeps = /('|")(.*?)\1/g,
        root = _path.substr( 0, _path.length - name.length - 3 ),
        dir = path.dirname( _path ),
        m, m2, deps, dep, _path2;

    contents = contents.replace( rDefine, function( m, m1, m2, m3 ) {
        return m1 + m3.replace( rDeps, function( m, m1, m2 ) {
            m2 = path.join( dir, m2 );
            m2 = path.relative( root, m2 );
            return m1 + m2 + m1;
        }) + ']';
    });

    return contents;
}

module.exports = function( grunt ) {
    grunt.registerMultiTask( 'build', '合并amd modules为一个单文件', function() {

        var done = this.async(),
            options = this.options({
                banner: '',
                footer: '',
                process: null,
                builtin: {
                    dollar: false,
                    promise: false
                }
            }),
            dest = this.data.dest,
            config, flag;

        config = {

            baseUrl: 'src',
            name: '',
            out: '',

            // We have multiple minify steps
            optimize: 'none',

            // Include dependencies loaded with require
            findNestedDependencies: true,

            // Avoid breaking semicolons inserted by r.js
            skipSemiColonInsertion: true,

            wrap: {
                startFile: 'build/intro.js',
                endFile: 'build/outro.js'
            },

            rawText: {},

            onBuildWrite: function( name, _path ) {
                var compiled = convert.apply( null, arguments );

                if ( options.process ) {
                    compiled = options.process( compiled, _path );
                }

                // 调整缩进
                compiled = compiled.replace( /(^|\r\n|\r|\n)/g, '$1    ')

                return compiled;
            },

            paths: [],
            include: []
        };

        options = grunt.util._.extend( options, this.data );
        config.name = 'preset/'+this.data.preset;

        if ( options.builtin.dollar ) {
            config.rawText.dollar = 'define([\n' +
                    '    \'./dollar-builtin\'\n' +
                    '], function( $ ) {\n' +
                    '    return $;\n' +
                    '});';
        }

        if ( options.builtin.promise ) {
            config.rawText.promise = 'define([\n' +
                    '    \'./promise-builtin\'\n' +
                    '], function( $ ) {\n' +
                    '    return $;\n' +
                    '});';
        }

        // 处理最终输出
        config.out = function( compiled ) {
            var arr = [],
                banner = grunt.template.process(options.banner),
                footer = grunt.template.process(options.footer),
                sep = '\n\n';

            banner && arr.push( banner );
            arr.push(compiled);
            footer && arr.push( footer );

            // Write concatenated source to file
            grunt.file.write( dest, arr.join( sep ) );

            process.nextTick(function() {
                // requirejs有bug, callback不一定会执行，目前调试的结果是
                // prim的promise实现有问题。
                if ( flag ) return;
                grunt.log.ok( "File '" + dest + "' created." );
                done();
                flag = true;
            });
        };

        requirejs.optimize( config, function( response ) {
            // requirejs有bug, callback不一定会执行，目前调试的结果是
            // prim的promise实现有问题。
            if ( flag ) return;
            grunt.verbose.writeln( response );
            grunt.log.ok( "File '" + name + "' created." );
            done();
            flag = true;
        }, function( err ) {
            done( err );
        });
    });
};