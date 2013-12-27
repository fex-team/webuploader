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

                    '!jq-bridge.js',
                    '!promise.js'

                    // '!runtime/flash/**/*.js'

                ],


                dest: 'dist/webuploader.js'
            },

            html5only: {
                cwd: 'src',

                src: [
                    'widgets/filepicker.js',
                    '**/*.js',

                    '!runtime/flash/**/*.js',

                    '!jq-bridge.js',
                    '!promise.js'

                ],


                dest: 'dist/webuploader.html5only.js'
            },

            flashonly: {
                cwd: 'src',

                src: [
                    'widgets/filepicker.js',
                    '**/*.js',

                    '!runtime/html5/**/*.js',

                    '!jq-bridge.js',
                    '!promise.js'
                ],


                dest: 'dist/webuploader.flashonly.js'
            },

            // 如果没有图片处理功能，则只需要一下配置一下文件。
            ignoreimages: {
                cwd: 'src',

                src: [
                    // 把剩余的打包进来。
                    'widgets/filepicker.js',
                    'widgets/filednd.js',
                    'widgets/queue.js',
                    'widgets/runtime.js',
                    'widgets/upload.js',

                    // html5运行时
                    'runtime/html5/blob.js',
                    'runtime/html5/transport.js',
                    'runtime/html5/filepicker.js',
                    'runtime/html5/dnd.js',


                    'runtime/flash/blob.js',
                    'runtime/flash/transport.js',
                    'runtime/flash/filepicker.js',

                    '!jq-bridge.js',
                    '!promise.js'

                ],


                dest: 'dist/webuploader.withoutimage.js'
            }

        },

        uglify: {
            options: {
                mangle: true,
                banner: '/* WebUploader <%= pkg.version %> */'
            },

            static_mapping: {
                files: [{
                    src: 'dist/webuploader.js',
                    dest: 'dist/webuploader.min.js'
                }, {
                    src: 'dist/webuploader.flashonly.js',
                    dest: 'dist/webuploader.flashonly.min.js'
                }, {
                    src: 'dist/webuploader.html5only.js',
                    dest: 'dist/webuploader.html5only.min.js'
                }, {
                    src: 'dist/webuploader.withoutimage.js',
                    dest: 'dist/webuploader.withoutimage.min.js'
                }, ]
            }
        },

        watch: {
            options: {
                debounceDelay: 250
            },

            all: {
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: ['default'],
            },

            dist: {
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: [ 'dist'],
            },

            doc: {
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: ['doc'],
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
        },

        doc: {
            options: {
                cwd: './src/',
                files: [
                    'uploader.js',
                    'base.js',
                    'mediator.js',
                    '**/*.js'
                ],
                theme: 'gmu',
                outputDir: './doc',
                title: 'WebUploader API文档'
            }
        },

        jekyll: {
            options: { // Universal options
                src: 'jekyll'
            },
            dist: { // Target
                options: { // Target options
                    dest: 'pages',
                    config: 'jekyll/_config.yml'
                }
            }
        },

        'gh-pages': {
            options: {
                message: '程序自动提交，源码请查看tree/master/jekyll目录',
                base: 'pages',
                repo: 'https://github.com/gmuteam/webuploader.git'
            },
            src: ['**/*']
        }
    });

    // 负责报告文件大小
    grunt.loadNpmTasks( 'grunt-size' );

    // 负责代码规范检测
    grunt.loadNpmTasks( 'grunt-jsbint' );

    // 负责监听文件变化
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    grunt.loadNpmTasks( 'grunt-contrib-uglify' );

    grunt.loadNpmTasks('grunt-jekyll');

    grunt.loadNpmTasks('grunt-gh-pages');

    // 加载build目录下的所有task
    grunt.loadTasks( 'build/tasks' );

    // Default task(s).
    grunt.registerTask( 'default', [ 'jsbint:all', 'concat:all' ] );
    grunt.registerTask( 'dist', [ 'concat' ] );
};