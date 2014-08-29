/**
 * @fileOverview 没有图像处理的版本。
 */
define([
    '../base',

    // widgets
    '../widgets/filednd',
    '../widgets/filepaste',
    '../widgets/filepicker',
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
    '../runtime/html5/transport',

    // flash
    '../runtime/flash/filepicker',
    '../runtime/flash/transport',
    '../runtime/flash/blob'
], function( Base ) {
    return Base;
});