module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        build: {
            options: {
                banner: '/*! WebUploader <%= pkg.version %> */\n',

                // 调整缩进
                process: function( src, filepath ) {
                    return src.replace( /(^|\r\n|\r|\n)/g, '$1    ');
                }
            },

            all: {
                preset: 'all',
                dest: "dist/webuploader.js",

                // 在没有jquery类似的库的前提下可以设置builtin,去除强行依赖。
                builtin: {
                    dollar: false,
                    promise: false
                }
            },

            flashonly: {
                preset: 'flashonly',
                dest: "dist/webuploader.flashonly.js",
            },

            html5only: {
                preset: 'html5only',
                dest: "dist/webuploader.html5only.js",
            },

            withoutimage: {
                preset: 'withoutimage',
                dest: "dist/webuploader.withoutimage.js",
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
                }]
            }
        },

        copy: {
            jekyll: {
                src: 'dist/webuploader.js',
                dest: 'jekyll/js/webuploader.js',
            },

            dist: {
                src: 'css/webuploader.css',
                dest: 'dist/webuploader.css'
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
                files: ['src/**/*.js', 'Gruntfile.js', 'build/docTpl/**/*'],
                tasks: ['doc'],
            },


            dev: {
                files: 'src/**/*.js',
                tasks: 'build:all'
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
                tplDir: './build/docTpl',
                theme: 'gmu',
                outputDir: './jekyll/doc',
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
                repo: 'https://github.com/fex-team/webuploader.git'
            },
            src: ['**/*']
        },

        qunit: {
            all: {
                options: {
                    urls: [
                        'http://0.0.0.0:8000/test/index.html'
                    ]
                }
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
                    base: '.'
                }
            }/*,

            keepalive: {
                options: {
                    port: 8000,
                    base: '.',
                    keepalive: true
                }
            }*/
        },
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

    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');

    // 加载build目录下的所有task
    grunt.loadTasks( 'build/tasks' );

    // Default task(s).
    grunt.registerTask( 'default', [ 'jsbint:all', 'dist' ] );
    grunt.registerTask( 'dist', [ 'build', 'uglify', 'copy' ] );
    grunt.registerTask( 'deploy', [ 'doc', 'jekyll', 'gh-pages' ] );
    grunt.registerTask( 'test', [ 'connect', 'qunit' ] );
};
