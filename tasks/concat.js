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


    grunt.registerMultiTask('concat', 'Concatenate files.', function() {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            separator: grunt.util.linefeed,
            banner: '',
            footer: '',
            stripBanners: false,
            process: false,
            filesFilter: false
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