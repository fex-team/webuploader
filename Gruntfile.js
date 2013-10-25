module.exports = function(grunt) {
    'use strict';

    var path = require('path');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                banner: '/* WebUploader <%= pkg.version %> */\n(function( window, undefined ) {\n',
                footer: '\n})( this );',
                separator: '\n\n',
                process: function( src, filepath ) {
                    return src.replace( /@version@/g, grunt.config.get('pkg.version') )
                            .replace( /(^|\r\n|\r|\n)/g, '$1    ');
                },

                // 排序，让被依赖的文件移至最上面。
                filesFilter: function( f, files ) {
                    var cwd = f.cwd || '',
                        ret = [],
                        process = function( file ) {
                            var fileinfo = path.join( cwd, file ),
                                str, matches, depends, idx;

                            if ( !grunt.file.exists( fileinfo ) ) {
                                return;
                            }

                            ret.push( file );

                            str = grunt.file.read( fileinfo );
                            matches = str.match(/@import\s(.*?)$/im);
                            if (matches) {
                                depends = matches[1]

                                    // 多个依赖用道号隔开
                                    .split(/\s*,\s*/g);

                                idx = ret.indexOf( file );
                                [].splice.apply( ret, [ idx, 0 ].concat( depends ) );
                                depends.forEach( process );
                            }


                        };
                    // console.log( files );
                    files.forEach( process );
                    ret = ret.filter(function( item, idx, arr ){
                        return idx === arr.indexOf( item );
                    });

                    return ret;
                }
            },
            all: {
                options: {
                    process: function( src, filepath ) {
                        return src
                            .replace( /webuploader\/jq-bridge/g, 'jQuery' )
                            .replace( /@version@/g, grunt.config.get('pkg.version') )
                            .replace( /(^|\r\n|\r|\n)/g, '$1    ');
                    }
                },

                cwd: 'src',

                src: [
                    'amd.js',
                    // 'jq-bridge.js',
                    'base.js',
                    // 'promise.js',

                    // 把剩余的打包进来。
                    '**/*.js',


                    '!exports.js',
                    'exports.js'
                ],


                dest: 'dist/webuploader.js'
            }

            // xiangce: {
            //     options: {
            //         banner: '/* WebUploader <%= pkg.version %> */\n(function( window, undefined ) {\n',
            //         footer: '\n})( this );\nexports = this.WebUploader;',
            //         separator: '\n\n',
            //         process: function( src, filepath ) {
            //             return src
            //                 .replace( /jq-bridge/g, 'jQuery' )
            //                 .replace( /@version@/g, grunt.config.get('pkg.version') )
            //                 .replace( /(^|\r\n|\r|\n)/g, '$1    ');
            //         }
            //     },

            //     src: [
            //         'src/amd.js',
            //         'src/base.js',
            //         'src/core/mediator.js',
            //         'src/core/file.js',
            //         'src/core/error.js',
            //         'src/core/queue.js',
            //         'src/core/uploadmgr.js',
            //         'src/core/runtime.js',
            //         'src/core/uploader.js',
            //         'src/core/runtime/html5/runtime.js',
            //         'src/core/runtime/html5/util.js',

            //         // 把剩余的打包进来。
            //         'src/**/*.js',
            //         '!src/exports.js',
            //         '!src/jq-bridge.js',
            //         'src/exports.js'
            //     ],


            //     dest: '/Users/liaoxuezhi/www/xiangcefis/xiangce/static/picture/ui/webuploader/webuploader.js'
            // }


        },

        watch: {
            options: {
                debounceDelay: 250
            },

            all: {
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: ['default'],
            },

            debug: {
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: ['concat:all'],
            },

            dev: {
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: ['concat:xiangce'],
            }
        },

        jsbint: {
            options: {
                jshintrc: '.jshintrc'
            },

            all: ['src/**/*.js']
        },

        size: {
            dist: {
                cwd: 'dist/',
                src: '*.js'
            },

            src: {
                src: 'src/**/*.js'
            }
        }
    });

    // 加载build目录下的所有task
    // grunt.loadTasks( 'tasks' );

    // 负责报告文件大小
    grunt.loadNpmTasks( 'grunt-size' );

    // 负责代码规范检测
    grunt.loadNpmTasks( 'grunt-jsbint' );

    // 负责监听文件变化
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    // 加载build目录下的所有task
    grunt.loadTasks( 'tasks' );

    // Default task(s).
    grunt.registerTask( 'default', [ 'jsbint:all', 'concat:all' ] );
    grunt.registerTask( 'debug', [ 'watch:debug' ] );
    grunt.registerTask( 'dev', [ 'watch:dev' ] );
};