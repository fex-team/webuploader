/**
 * @fileOverview 完全版本。
 */
define([
    '../base',

    // widgets
    '../widgets/filednd',
    '../widgets/filepaste',
    '../widgets/filepicker',
    '../widgets/image',
    '../widgets/queue',
    '../widgets/runtime',
    '../widgets/upload',
    '../widgets/validator',
    '../widgets/md5',

    // runtimes
    // html5
    '../runtime/html5/blob',
    '../runtime/html5/dnd',
    '../runtime/html5/filepaste',
    '../runtime/html5/filepicker',
    '../runtime/html5/imagemeta/exif',
    '../runtime/html5/androidpatch',
    '../runtime/html5/image',
    '../runtime/html5/transport',
    '../runtime/html5/md5',

    // flash
    '../runtime/flash/filepicker',
    '../runtime/flash/image',
    '../runtime/flash/transport',
    '../runtime/flash/blob',
    '../runtime/flash/md5'
], function( Base ) {
    return Base;
});