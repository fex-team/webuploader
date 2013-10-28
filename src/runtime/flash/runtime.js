/**
 * @fileOverview FlashRuntime
 * @import base.js, runtime/runtime.js, runtime/compbase.js
 */
define( 'webuploader/runtime/flash/runtime', [
        'webuploader/base',
        'webuploader/runtime/runtime',
        'webuploader/runtime/compbase'
    ], function( Base, Runtime, CompBase ) {

        var $ = Base.$,
            type = 'flash',
            pool = {},
            components = {};


        function getFlashVersion() {
            var version;

            try {
                version = navigator.plugins['Shockwave Flash'];
                version = version.description;
            } catch (e1) {
                try {
                    version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
                } catch (e2) {
                    version = '0.0';
                }
            }
            version = version.match(/\d+/g);
            return parseFloat(version[0] + '.' + version[1]);
        }

        function FlashRuntime() {
            var pool = {},
                clients = {},
                destory = this.destory,
                runtime = this,
                jsreciver = 'webuploader_' +(new Date());

            Runtime.apply( this, arguments );
            this.type = type;


            // 这个方法的调用者，实际上是RuntimeClient
            this.exec = function( comp, fn/*, args...*/) {
                var client = this,
                    uid = client.uid,
                    args = Base.slice( arguments, 2 ),
                    instance;

                clients[ uid ] = client;

                if ( components[ comp ] ) {
                    if ( !pool[ uid ] ) {
                        pool[ uid ] = new components[ comp ]( runtime );
                    }

                    instance = pool[ uid ];

                    if ( instance[ fn ] ) {
                        instance.owner = client;
                        instance.options = client.options;
                        return instance[ fn ].apply( instance, args );
                    }
                }

                return runtime.flashExec.apply( client, arguments );
            }

            window[ jsreciver ] = function( evt, obj ) {
                var type = evt.type || evt,
                    parts, uid;

                parts = type.split('::');
                uid = parts[ 0 ];
                type = parts[ 1 ];

                if ( type === 'Ready' && uid === runtime.uid ) {
                    runtime.trigger( 'ready' );
                } else if ( clients[ uid ] ) {
                    clients[ uid ].trigger( type.toLowerCase(), evt, obj );
                }
            };
            this.jsreciver = jsreciver;

            this.destory = function() {
                // @todo 删除池子中的所有实例
                return destory && destory.apply( this, arguments );
            };

            this.flashExec = function( comp, fn ) {
                var flash = runtime.getFlash(),
                    args = Base.slice( arguments, 2 );

                return flash.exec( this.uid, comp, fn, args );
            };

            // @todo
        }

        Base.inherits( Runtime, {
            constructor: FlashRuntime,

            init: function() {
                var runtime = this,
                    container = this.getContainer(),
                    opts = this.options;

                // if not the minimal height, shims are not initialized in older browsers (e.g FF3.6, IE6,7,8, Safari 4.0,5.0, etc)
                container.css({
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    width: '9px',
                    height: '9px',
                    overflow: 'hidden'
                });

                // insert flash object
                html = '<object id="' + this.uid + '" type="application/x-shockwave-flash" data="' +  opts.swf + '" ';

                if ( Base.isIE ) {
                    html += 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ';
                }

                html += 'width="100%" height="100%" style="outline:0">'  +
                    '<param name="movie" value="' + opts.swf + '" />' +
                    '<param name="flashvars" value="uid=' + escape(this.uid) + '&jsreciver=' + this.jsreciver + '" />' +
                    '<param name="wmode" value="transparent" />' +
                    '<param name="allowscriptaccess" value="always" />' +
                '</object>';

                container.html( html );
            },

            getFlash: function() {
                if ( this._flash ) {
                    return this._flash;
                }

                return this._flash = $( '#'+ this.uid ).get(0);
            }

        } );

        FlashRuntime.register = function( name, component ) {
            return components[ name ] = Base.inherits( CompBase, $.extend( {

                // @todo fix this later
                flashExec: function() {
                    var owner = this.owner,
                        runtime = this.getRuntime();

                    return runtime.flashExec.apply( owner, arguments );
                }
            }, component) );
        };

        if ( getFlashVersion() >= 11.3 ) {
            Runtime.addRuntime( type, FlashRuntime );
        }

        return FlashRuntime;
    } );