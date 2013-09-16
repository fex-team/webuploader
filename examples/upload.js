(function( $ ){
    // 当domReady的时候开始初始化
    $(function() {
        var $wrap = $('#uploader'),

            // 图片容器
            $queue = $( '<ul class="filelist"></ul>' )
                .appendTo( $wrap.find( '.queueList' ) ),

            // 状态栏，包括进度和控制按钮
            $statusBar = $wrap.find( '.statusBar' ),

            // 文件总体选择信息。
            $info = $statusBar.find( '.info' ),

            // 上传按钮
            $upload = $wrap.find( '.uploadBtn' ),

            // 没选择文件之前的内容。
            $placeHolder = $wrap.find( '.placeholder' ),

            $progress = $statusBar.find( '.progress' ).hide(),

            // 添加的文件数量
            fileCount = 0,

            // 添加的文件总大小
            fileSize = 0,

            // 优化retina, 在retina下这个值是2
            ratio = window.devicePixelRatio || 1,

            // 缩略图大小
            thumbnailWidth = 110 * ratio,
            thumbnailHeight = 110 * ratio,

            // 可能有inited, uploading, paused四个值
            state = 'inited',

            // 所有文件的进度信息，key为file id
            percentages = {},

            // WebUploader实例
            uploader;

        // 实例化
        uploader = WebUploader.create({
            pick: {
                id: '#filePicker',
                btnName: '点击选择图片'
            },
            dnd: '#dndArea',
            paste: '#uploader',
            server: 'http://liaoxuezhi.fe.baidu.com/webupload/fileupload.php?debug=3',
            fileNumLimit: 300,
            fileSizeLimit: 400 * 1024 * 1024,    // 400 M
            fileSingleSizeLimit: 50 * 1024 * 1024    // 50 M
        });

        // 添加“添加文件”的按钮，
        uploader.addButton({
            id: '#filePicker2',
            btnName: '继续添加'
        });

        // 当有文件添加进来时执行，负责view的创建
        function addFile( file ) {
            var $li = $( '<li id="' + file.id + '">' +
                    '<p class="title">' + file.name + '</p>' +
                    '<p class="imgWrap"></p>'+
                    '<p class="progress"><span></span></p>' +
                    '</li>' ),

                $btns = $('<div class="file-panel">' +
                    '<span class="cancel">删除</span>' +
                    '<span class="rotateRight">向右旋转</span>' +
                    '<span class="rotateLeft">向左旋转</span></div>').appendTo( $li ),
                $prgress = $li.find('p.progress span'),
                $wrap = $li.find( 'p.imgWrap' ),
                $info = $('<p class="error"></p>'),

                showError = function( code ) {
                    switch( code ) {
                        case 'exceed_size':
                            text = '文件大小超出';
                            break;

                        default:
                            text = '上传失败，请重试';
                            break;
                    }

                    $info.text( text ).appendTo( $li );
                };

            if ( file.getStatus() === 'invalid' ) {
                showError( file.statusText );
            } else {
                // @todo lazyload
                uploader.makeThumb( file, function( img ) {
                    $wrap.html( img );
                }, thumbnailWidth, thumbnailHeight );
                $wrap.text( '预览中' );

                percentages[ file.id ] = [ file.size, 0 ];
                file.ratation = 0;
            }

            file.on('statuschange', function( cur, prev ) {
                if ( prev === 'progress' ) {
                    $prgress.width( 0 );
                } else if ( prev === 'queued' ) {
                    $li.off( 'mouseenter mouseleave' );
                    $btns.remove();
                } else if ( prev === 'error' ) {
                    $info.remove();
                }

                // 成功
                if ( cur === 'error' || cur === 'invalid' ) {
                    showError( file.statusText );
                }

                $li.removeClass( 'state-' + prev ).addClass( 'state-' + cur );
            });

            $li.on( 'mouseenter', function() {
                $btns.stop().animate({height: 30});
            });

            $li.on( 'mouseleave', function() {
                $btns.stop().animate({height: 0});
            });

            $btns.on( 'click', 'span', function() {
                var index = $(this).index(),
                    deg;

                switch ( index ) {
                    case 0:
                        uploader.removeFile( file );
                        break;

                    case 1:
                        file.ratation += 90;
                        break;

                    case 2:
                        file.ratation -= 90;
                        break;
                }

                // -webkit-transform: rotate(90deg);
                index && (deg = 'rotate(' + file.ratation + 'deg)', $wrap.css({
                    '-webkit-transform': deg,
                    '-mos-transform': deg,
                    '-o-transform': deg,
                    'transform': deg
                }));
            });

            $li.appendTo( $queue );
        }

        // 负责view的销毁
        function removeFile( file ) {
            var $li = $('#'+file.id);

            delete percentages[ file.id ];

            $li.off().find('.file-panel').off().end().remove();
        }

        function updateTotalProgress() {
            var loaded = 0,
                total = 0,
                spans = $progress.children(),
                percent;

            $.each( percentages, function( k, v ) {
                total += v[ 0 ];
                loaded += v[ 0 ] * v[ 1 ];
            } );

            percent = loaded / total;

            spans.eq( 0 ).text( Math.round( percent * 100 ) + '%' );
            spans.eq( 1 ).css( 'width', percent * 100 + '%' );
            updateStatus();
        }

        function updateStatus() {
            var text = '', stats;

            if ( state === 'inited' ) {
                text = '选中' + fileCount + '张图片，共' +
                        uploader.formatSize( fileSize ) + '。';
            } else if ( state === 'confirm' ) {
                stats = uploader.getStats();
                if ( stats.uploadFailNum ) {
                    text = '已成功上传' + stats.successNum+ '张照片至XX相册，'+
                        stats.uploadFailNum + '张照片上传失败，<a class="retry" href="#">重新上传</a>失败图片或<a class="ignore" href="#">忽略</a>'
                }

            } else {
                stats = uploader.getStats();
                text = '共' + fileCount + '张（' +
                        uploader.formatSize( fileSize )  +
                        '），已上传' + stats.successNum + '张';

                if ( stats.uploadFailNum ) {
                    text += '，失败' + stats.uploadFailNum + '张';
                }
            }

            $info.html( text );
        }

        function setState( val, isRetry ) {
            var file;

            switch ( val ) {
                case 'uploading':
                    $progress.show();
                    uploader[ isRetry ? 'retry' : 'upload' ]();
                    $upload.text( '暂停上传' );
                    break;

                case 'paused':
                    uploader.stop();
                    $upload.text( '继续上传' );
                    break;

                case 'confirm':
                    $progress.hide();
                    $( '#filePicker2' ).hide();

                    $upload.text( '确认上传' );
                    break;
            }

            $upload.removeClass( 'state-' + state );
            $upload.addClass( 'state-' + val );
            state = val;
            updateStatus();
        }

        uploader.onUploadProgress = function( file, percentage ) {
            var $li = $('#'+file.id),
                $percent = $li.find('.progress span');

            $percent.css( 'width', percentage * 100 + '%' );
            percentages[ file.id ][ 1 ] = percentage;
            updateTotalProgress();
        };

        uploader.onFileQueued = function( file ) {
            fileCount++;
            fileSize += file.size;

            if ( fileCount === 1 ) {
                $placeHolder.hide();
                $statusBar.show();
            }

            addFile( file );
            updateStatus();
        };

        uploader.onFileDequeued = function( file ) {
            fileCount--;
            fileSize -= file.size;

            if ( !fileCount ) {
                $placeHolder.show();
                $statusBar.hide();
            }

            removeFile( file );
            updateStatus();
        };

        uploader.onUploadFinished = function() {
            setState( 'confirm' );
        };

        uploader.onError = function( code ) {
            alert( 'Eroor: ' + code );
        };

        $upload.on('click', function() {
            var nextstate = '';
            if ( state === 'inited' || state === 'paused'  ) {
                nextstate = 'uploading';
            } else if ( state === 'uploading' ) {
                nextstate = 'paused';
            } else if ( state === 'confirm' ) {
                nextstate = 'finish';
            }

            nextstate && setState( nextstate );
        });

        $info.on( 'click', '.retry', function() {
            setState( 'uploading', true );
        } );

        $info.on( 'click', '.ignore', function() {
            alert( 'todo' );
        } );

        $upload.addClass( 'state-' + state );
        updateTotalProgress();
    });

})( jQuery );