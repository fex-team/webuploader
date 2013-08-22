module.exports = function(grunt) {

    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            all: {
                options: {
                    banner: '/* WebUploader <%= pkg.version %> */\n'
                },

                src: [
                    'src/intro.js',
                    'src/core/base.js',
                    'src/core/jq-bridge.js',
                    'src/core/**/*.js',
                    'src/exports.js',
                    'src/outro.js'
                ],

                dest: 'dist/webuploader.js'
            }
        },

        watch: {
            options: {
                debounceDelay: 250
            },

            doc: {
                files: ['src/**/*.js'],
                tasks: ['doc'],
            },

            concat: {
                files: ['src/**/*.js'],
                tasks: ['concat'],
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
                cwd: 'src/',
                src: '/**/*.js'
            }
        }
    });

    // 加载build目录下的所有task
    // grunt.loadTasks( 'tasks' );

    // 负责合并代码
    grunt.loadNpmTasks( 'grunt-contrib-concat' );

    // 负责报告文件大小
    grunt.loadNpmTasks( 'grunt-size' );

    // 负责代码规范检测
    grunt.loadNpmTasks( 'grunt-jsbint' );

    // 负责监听文件变化
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    // Default task(s).
    grunt.registerTask( 'default', [ 'jsbint', 'concat', 'size'] );
};