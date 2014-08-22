/**
 * @fileOverview FlashRuntime
 */
define([
    '../../base',
    '../runtime',
    '../compbase'
], function( Base, Runtime, CompBase ) {

    var $ = Base.$,
        type = 'flash',
        components = {};


    function getFlashVersion() {
        var version;

        try {
            version = navigator.plugins[ 'Shockwave Flash' ];
            version = version.description;
        } catch ( ex ) {
            try {
                version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
                        .GetVariable('$version');
            } catch ( ex2 ) {
                version = '0.0';
            }
        }
        version = version.match( /\d+/g );
        return parseFloat( version[ 0 ] + '.' + version[ 1 ], 10 );
    }

    function FlashRuntime() {
        var pool = {},
            clients = {},
            destroy = this.destroy,
            me = this,
            jsreciver = Base.guid('webuploader_');

        Runtime.apply( me, arguments );
        me.type = type;


        // 这个方法的调用者，实际上是RuntimeClient
        me.exec = function( comp, fn/*, args...*/ ) {
            var client = this,
                uid = client.uid,
                args = Base.slice( arguments, 2 ),
                instance;

            clients[ uid ] = client;

            if ( components[ comp ] ) {
                if ( !pool[ uid ] ) {
                    pool[ uid ] = new components[ comp ]( client, me );
                }

                instance = pool[ uid ];

                if ( instance[ fn ] ) {
                    return instance[ fn ].apply( instance, args );
                }
            }

            return me.flashExec.apply( client, arguments );
        };

        function handler( evt, obj ) {
            var type = evt.type || evt,
                parts, uid;

            parts = type.split('::');
            uid = parts[ 0 ];
            type = parts[ 1 ];

            // console.log.apply( console, arguments );

            if ( type === 'Ready' && uid === me.uid ) {
                me.trigger('ready');
            } else if ( clients[ uid ] ) {
                clients[ uid ].trigger( type.toLowerCase(), evt, obj );
            }

            // Base.log( evt, obj );
        }

        // flash的接受器。
        window[ jsreciver ] = function() {
            var args = arguments;

            // 为了能捕获得到。
            setTimeout(function() {
                handler.apply( null, args );
            }, 1 );
        };

        this.jsreciver = jsreciver;

        this.destroy = function() {
            // @todo 删除池子中的所有实例
            return destroy && destroy.apply( this, arguments );
        };

        this.flashExec = function( comp, fn ) {
            var flash = me.getFlash(),
                args = Base.slice( arguments, 2 );

            return flash.exec( this.uid, comp, fn, args );
        };

        // @todo
    }

    Base.inherits( Runtime, {
        constructor: FlashRuntime,

        init: function() {
            var container = this.getContainer(),
                opts = this.options,
                html;

            // if not the minimal height, shims are not initialized
            // in older browsers (e.g FF3.6, IE6,7,8, Safari 4.0,5.0, etc)
            container.css({
                position: 'absolute',
                top: '-8px',
                left: '-8px',
                width: '9px',
                height: '9px',
                overflow: 'hidden'
            });

            // insert flash object
            html = '<object id="' + this.uid + '" type="application/' +
                    'x-shockwave-flash" data="' +  opts.swf + '" ';

            if ( Base.browser.ie ) {
                html += 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ';
            }

            html += 'width="100%" height="100%" style="outline:0">'  +
                '<param name="movie" value="' + opts.swf + '" />' +
                '<param name="flashvars" value="uid=' + this.uid +
                '&jsreciver=' + this.jsreciver + '" />' +
                '<param name="wmode" value="transparent" />' +
                '<param name="allowscriptaccess" value="always" />' +
            '</object>';

            container.html( html );
        },

        getFlash: function() {
            if ( this._flash ) {
                return this._flash;
            }

            this._flash = $( '#' + this.uid ).get( 0 );
            return this._flash;
        }

    });

    FlashRuntime.register = function( name, component ) {
        component = components[ name ] = Base.inherits( CompBase, $.extend({

            // @todo fix this later
            flashExec: function() {
                var owner = this.owner,
                    runtime = this.getRuntime();

                return runtime.flashExec.apply( owner, arguments );
            }
        }, component ) );

        return component;
    };

    if ( getFlashVersion() >= 11.4 ) {
        Runtime.addRuntime( type, FlashRuntime );
    }

    return FlashRuntime;
});