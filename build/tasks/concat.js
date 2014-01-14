/*
 * grunt-contrib-concat
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    var path = require('path');

    function stripBanner(src, options) {
        if (!options) {
            options = {};
        }
        var m = [];
        if (options.line) {
            // Strip // ... leading banners.
            m.push('(?:.*\\/\\/.*\\r?\\n)*\\s*');
        }
        if (options.block) {
            // Strips all /* ... */ block comment banners.
            m.push('\\/\\*[\\s\\S]*?\\*\\/');
        } else {
            // Strips only /* ... */ block comment banners, excluding /*! ... */.
            m.push('\\/\\*[^!][\\s\\S]*?\\*\\/');
        }
        var re = new RegExp('^\\s*(?:' + m.join('|') + ')\\s*', '');
        return src.replace(re, '');
    }

    var intro = path.join(__dirname, '../intro.js');
    var outro = path.join(__dirname, '../outro.js');

    // 排序，把依赖的文件移动到最上面。
    function filesFilter( f, files ) {
        var cwd = f.cwd || '',
            ret = [],
            process = function( file ) {
                var fileinfo = path.join( cwd, file ),
                    dirpath = path.dirname( fileinfo ),
                    depends = [],
                    str, matches, idx;

                if ( !grunt.file.exists( fileinfo ) ) {
                    return;
                }

                ret.push( file );

                str = grunt.file.read( fileinfo );

                // 从require( dps )中找
                // 从defind( id?, dps, factory )中找
                str = str.replace( /(?:define|require)\s*\(\s*\[([^\]]+?)\],/g, function( _, m1 ) {
                    m1 = m1.replace(/\s/g, '').split(',');
                    depends = depends.concat( m1.map(function( item ) {
                        item = item.substring( 1, item.length - 1 );
                        item = item.substring(0, 1) === '.' ?
                                path.join( dirpath, item ):
                                path.join( cwd, item );

                        return path.relative( cwd, item ) + '.js';
                    }) );

                    return _;
                });

                str = str.replace( /require\s*\(\s*('|")(.+?)\1/g, function( _, m1, item ) {


                    item = item.substring(0, 1) === '.' ?
                            path.join( dirpath, item ):
                            path.join( cwd, item );

                    depends.push( path.relative( cwd, item ) + '.js' );

                    return _;
                });

                if ( depends.length ) {
                    depends = depends.filter(function( item, idx, array ) {
                        return array.indexOf( item ) === idx && grunt.file.exists( path.join( cwd, item ) );
                    });

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


        ret.unshift( path.relative( cwd, intro ) );
        ret.push( path.relative( cwd, outro ) );
        return ret;
    }

    // 缓存版本号
    var version;

    function fileProcess( src, filepath, cwd ) {
        var dirpath = path.dirname( filepath );

        version = version || grunt.config.get('pkg.version');

        src = src.replace( /@version@/g, version );

        // 不处理 outro.js
        if (filepath.indexOf('outro') >= 0) {
            return src;
        }
        // console.log( filepath, cwd );

        // 处理 define( dps ?, factory );
        // 处理 require( dps );
        src = src.replace( /(define|require)\s*\((?:\s*\[([^\]]+)\],)?/g, function( _, m1, m2 ) {
            var str = m1 + '(',
                item;

            if ( m1 === 'define' ) {
                item = path.relative( cwd, filepath );
                item = item.substring( 0, item.length - 3 );
                str += ' \'' + item.replace(/\\/g, '/') + '\', ';
            }

            if ( m2 ) {
                m2 = m2.replace(/\s/g, '').split(',');

                m2 = m2.map(function( item ) {
                    var _file = item;
                    _file = _file.substring( 1, _file.length - 1 );
                    _file = _file.substring(0, 1) === '.' ?
                        path.join( dirpath, _file ) :
                        path.join( cwd, _file.substring( 1 ) );

                    if ( !grunt.file.exists( _file + '.js' ) ) {
                        return item;
                    }

                    _file = path.relative( cwd, _file );
                    return '\'' + _file.replace(/\\/g, '/').toLowerCase() + '\'';
                });

                if ( m2.length ) {
                    str += '[\n    ' + m2.join(',\n    ') + '\n],';
                } else {
                    str += '[],';
                }
            }

            // console.log( str );
            return str;
        });

        // 处理 require( id );
        src = src.replace( /require\s*\(\s*('|")(.+?)\1\s*\)/g, function( _, m1, m2 ) {
            var _file = m2;

            _file = _file.substring(0, 1) === '.' ?
                path.join( dirpath, _file ) :
                path.join( cwd, _file.substring( 1 ) );

            if ( !grunt.file.exists( _file + '.js' ) ) {
                return _;
            }

            _file = path.relative( cwd, _file );
            return 'require(\'' + _file + '\')';
        });

        return src;
    }


    grunt.registerMultiTask('concat', 'Concatenate files.', function() {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            separator: grunt.util.linefeed,
            banner: '',
            footer: '',
            stripBanners: false,
            process: null,
            filesFilter: filesFilter
        });

        // Normalize boolean options that accept options objects.
        if (options.stripBanners === true) {
            options.stripBanners = {};
        }
        if (options.process === true) {
            options.process = {};
        }

        // Process banner and footer.
        var banner = grunt.template.process(options.banner);
        var footer = grunt.template.process(options.footer);

        // Iterate over all src-dest file pairs.
        this.files.forEach(function(f) {
            var files = f.src;

            if (typeof options.filesFilter === 'function') {
                files = options.filesFilter( f, files );
            }

            // Concat banner + specified files + footer.
            var cwd = f.cwd || '',
                src = banner + files.filter(function(filepath) {

                filepath = path.join( cwd, filepath );
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function(filepath) {
                filepath = path.join( cwd, filepath );

                // Read file source.
                var src = grunt.file.read(filepath);

                // 文件处理，用来支持amdefine
                src = fileProcess( src, filepath, cwd );

                // Process files as templates if requested.
                if (typeof options.process === 'function') {
                    src = options.process(src, filepath);
                } else if (options.process) {
                    src = grunt.template.process(src, options.process);
                }

                // Strip banners if requested.
                if (options.stripBanners) {
                    src = stripBanner(src, options.stripBanners);
                }

                return src;
            }).join(options.separator) + footer;

            // Write the destination file.
            grunt.file.write(f.dest, src);

            // Print a success message.
            grunt.log.writeln('File "' + f.dest + '" created.');
        });
    });

};
