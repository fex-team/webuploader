/**
 * @fileOverview 只有html5实现的文件版本。
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

    // runtimes
    // html5
    '../runtime/html5/blob',
    '../runtime/html5/dnd',
    '../runtime/html5/filepaste',
    '../runtime/html5/filepicker',
    '../runtime/html5/imagemeta/exif',
    '../runtime/html5/image',
    '../runtime/html5/transport'
], function( Base ) {
    return Base;
});