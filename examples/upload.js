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

            $progress = $statusBar.find( '.progress' ),

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
            server: 'http://liaoxuezhi.fe.baidu.com/webupload/fileupload.php'
        });

        // 添加“添加文件”的按钮，
        uploader.addButton({
            id: '#filePicker2',
            btnName: '继续添加'
        });

        // 当有文件添加进来时执行，负责view的创建
        function addFile( file ) {
            var $li = $( '<li id="' + file.id + '">' +
                    '<p class="progress"><span></span></p>' +
                    '<p class="imgWrap">预览中</p></li>' ),
                $wrap = $li.find('p.imgWrap'),
                $btns = $('<div class="file-panel">' +
                    '<span class="cancel">删除</span>' +
                    '<span class="rotateRight">向右旋转</span>' +
                    '<span class="rotateLeft">向左旋转</span></div>').appendTo( $li ),
                $prgress = $li.find('p.progress span');



            uploader.getImageThumbnail( file, function( img ) {
                $wrap.empty().append( img );
            }, thumbnailWidth, thumbnailHeight );

            file.on('statuschange', function( cur, prev ) {
                var $info;

                // 成功
                if ( cur === 3 || cur === 4 ) {
                    $prgress.width( 0 );

                    $info = $('<p class="info"></p>');
                    $info.addClass( cur === 4 ? 'success' : 'error' );
                    cur === 3 && $info.text( '上传失败，请重试' );

                    $info.appendTo( $li );
                }
            });

            $li.on( 'mouseenter', function() {
                if ( file.getStatus() !== 1 ) {
                    return;
                }
                $btns.stop().animate({height: 30});
            });

            $li.on( 'mouseleave', function() {
                if ( file.getStatus() !== 1 ) {
                    return;
                }
                $btns.stop().animate({height: 0});
            });

            percentages[ file.id ] = [ file.size, 0 ];
            file.ratation = 0;
            file.on( 'downsize', function( cur, prev ) {
                percentages[ file.id ][ 0 ] = cur;
                fileSize += cur - prev;
            } );

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
                    'transform': deg,
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

            if ( percent ) {
                $progress.show();
            } else {
                $progress.hide();
                return;
            }

            spans.eq( 0 ).text( Math.round( percent * 100 ) + '%' );
            spans.eq( 1 ).css( 'width', percent * 100 + '%' );
        }

        function updateInfo() {
            var size = fileSize,
                units = ['B', 'K', 'M', 'TB'],
                unit = units.shift();

            while ( size > 1024 && units.length ) {
                unit = units.shift();
                size = size / 1024;
            }

            size = (unit === 'B' ? size : size.toFixed(2)) + '' + unit;

            $info.text( '选中' + fileCount + '张图片，共' + size + '。' );
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
            updateInfo();
        };

        uploader.onFileDequeued = function( file ) {
            fileCount--;
            fileSize -= file.size;

            if ( !fileCount ) {
                $placeHolder.show();
                $statusBar.hide();
            }

            removeFile( file );
            updateInfo();
        };

        uploader.onUploadFinished = function() {
            state = 'inited';
            $upload[ 0 ].className = $upload[ 0 ].className.replace( /\bstate-\w+?\b/g, '' );
            $upload.addClass( 'state-' + state );
            $upload.text( '开始上传' ).hide();

            $('#filePicker2').hide();
        };

        $upload.on('click', function() {
            if ( state === 'inited' || state === 'paused'  ) {
                uploader.upload();
                $upload.text( '暂停上传' );
                state = 'uploading';
            } else if ( state === 'uploading' ) {
                state = 'paused';
                $upload.text( '继续上传' );
                uploader.stop();
            }
            $upload[ 0 ].className = $upload[ 0 ].className.replace( /\bstate-\w+?\b/g, '' );
            $upload.addClass( 'state-' + state );
        });

        $upload.addClass( 'state-' + state );
        updateTotalProgress();
    });
})( jQuery );