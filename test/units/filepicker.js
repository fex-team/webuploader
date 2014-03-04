define([
    'webuploader/preset/all'
], function( Base ) {
    var $fixture;

    module( 'FilePicker', {
        setup: function() {
            $fixture = $('#qunit-fixture');
        },

        teardown: function() {
            $fixture.empty();
            $fixture = null;
        }
    });

    test( 'Test initialize', 3, function() {
        var $btns, $pickers;

        $fixture.append('<div class="btn">Button One</div><div class="btn">Button Two</div>');


        $btns = $fixture.find('.btn').each(function( i ) {
            Base.create({
                pick: this
            });
        });

        $pickers = $btns.find('.webuploader-pick');
        equal( $pickers.length, 2, 'The length should be 2.' );
        equal( $pickers.eq(0).text(), 'Button One', 'ok' );
        equal( $pickers.eq(1).text(), 'Button Two', 'ok' );

    });

});