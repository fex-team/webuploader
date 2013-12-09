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

                // 调整缩进
                process: function( src, filepath ) {
                    return src.replace( /(^|\r\n|\r|\n)/g, '$1    ');
                }
            },

            all: {
                options: {
                    process: function( src ) {
                        return src
                                // .replace('jQuery', 'jq-bridge')
                                .replace( /(^|\r\n|\r|\n)/g, '$1    ');
                    }
                },

                cwd: 'src',

                src: [
                    // 'jq-bridge.js',

                    // 把剩余的打包进来。
                    'widgets/filepicker.js',
                    '**/*.js',

                    '!runtime/html5/**/*.js',


                    '!exports.js',
                    'exports.js'
                ],


                dest: 'dist/webuploader.js'
            },

            // xiangce: {
            //     options: {
            //         banner: '/* WebUploader <%= pkg.version %> */\n(function( window, undefined ) {\n',
            //         footer: '\n})( this );\nexports = this.WebUploader;',
            //     },

            //     cwd: 'src',

            //     src: [
            //         // 把剩余的打包进来。
            //         'widgets/filepicker.js',
            //         '**/*.js',

            //         '!exports.js',
            //         'exports.js'
            //     ],


            //     dest: 'dist/webuploader.js'
            // },

            // music: {
            //     cwd: 'src',

            //     src: [
            //         'amd.js',
            //         'base.js',

            //         // 把剩余的打包进来。
            //         'widgets/filepicker.js',
            //         'widgets/filednd.js',
            //         'widgets/queue.js',
            //         'widgets/runtime.js',
            //         'widgets/upload.js',

            //         'runtime/html5/blob.js',
            //         'runtime/html5/transport.js',
            //         'runtime/html5/filepicker.js',
            //         'runtime/html5/dnd.js',

            //         '!exports.js',
            //         'exports.js'
            //     ],

            //     dest: 'examples/music/webuploader.js'
            // },

            // wenku: {
            //     options: {
            //         banner: '/* WebUploader <%= pkg.version %> */\n(function( window, undefined ) {\n',
            //         footer: '\n})( this );exports = WebUploader;'
            //     },

            //     cwd: 'src',

            //     src: [
            //         'amd.js',
            //         // 'jq-bridge.js',
            //         'base.js',
            //         // 'promise.js',

            //         // 把剩余的打包进来。
            //         'widgets/filepicker.js',
            //         'widgets/filednd.js',
            //         'widgets/queue.js',
            //         'widgets/runtime.js',
            //         'widgets/upload.js',

            //         'runtime/html5/blob.js',
            //         'runtime/html5/transport.js',
            //         'runtime/html5/filepicker.js',
            //         'runtime/html5/dnd.js',


            //         '!exports.js',
            //         'exports.js'
            //     ],


            //     dest: '/Users/liaoxuezhi/www/wenku/common/static/common/ui/js_core/upload/webuploader.js'
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
                tasks: [ 'concat:all'],
            },

            dev: {
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: ['concat:xiangce'],
            },

            concat: {
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: ['concat:wenku'],
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

    // 负责报告文件大小
    grunt.loadNpmTasks( 'grunt-size' );

    // 负责代码规范检测
    grunt.loadNpmTasks( 'grunt-jsbint' );

    // 负责监听文件变化
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    // 加载build目录下的所有task
    grunt.loadTasks( 'build/tasks' );

    // Default task(s).
    grunt.registerTask( 'default', [ 'jsbint:all', 'concat:all' ] );
    grunt.registerTask( 'debug', [ 'watch:debug' ] );
    grunt.registerTask( 'dev', [ 'watch:dev' ] );
};