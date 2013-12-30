jQuery(function() {
    var $ = jQuery,
        $toc = $('.post-toc');



    $toc.each(function() {
        var $this = $( this ),
            postion = $this.offset();

        $this.affix({
            offset: {
                top: postion.top - 80
            }
        });
    });

    if ( $toc.length ) {
        $('body').scrollspy({ target: '.post-toc' });
    }
});