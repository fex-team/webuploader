define( 'WebUploader/core/runtime/html5/Runtime', [
        'WebUploader/Base',
        'WebUploader/core/Runtime' ], function( Base, Runtime ) {

    var $ = Base.$,
        type = 'html5',
        caps = {},

        // 模块表。
        components = {},
        detects = [];

    function Html5Runtime( opts ) {

        detects.length && $.each( detects, function( i, fn ) {
            $.extend( caps, fn() );
        } );
        detects = [];

        // 如果val是function, 则执行它，并把结果保存。
        $.each( caps, function( key, val ) {
            if ( typeof val === 'function' ) {
                caps[ key ] = !!val.call( me );
            }
        } );

        Runtime.call( this, opts, type, caps );
    }

    Base.inherits( Runtime, {
        // ---------- 原型方法 ------------

        constructor: Html5Runtime,

        init: function() {
            this.trigger( 'ready' );
        },

        /**
         * 执行指定模块的，指定方法。
         */
        exec: function( component, api/*, args...*/ ) {
            var args = [].slice.call( arguments, 2 );

            component = this.getComponent( component );

            if ( typeof component[ api ] === 'function' ) {
                return component[ api ].apply( component, args );
            }
        },

        /**
         * 获取component, 每个Runtime只会中，component只会实例化一次。
         */
        getComponent: function( name, opts ) {
            var pool = this._objPool || (this._objPool = {}),
                component;

            if ( !pool[ name ] && (component = components[ name ]) ) {

                if ( typeof component === 'function' ) {
                    component = new component( opts );
                } else {
                    component = $.extend( {}, component );
                }

                component.runtime = this;
                pool[ name ] = component;
            }

            return pool[ name ];
        }

    }, {
        // ---------- 静态方法 -------

        // 添加能力，有些能力是在模块中添加的。
        // 如果val可以是boolean值，或者function，在运行后返回boolean值
        capable: function( name, val ) {
            if ( $.isPlainObject( name ) ) {
                $.extend( caps, name );
            } else if ( typeof name === 'function' ) {
                detects.push( name );
            } else {
                caps[ name ] = val;
            }
        },

        // 注册模块
        register: function( name, component ) {
            components[ name ] = component;
        }
    } );


    // 注册html5运行时。
    Runtime.addRuntime( type, Html5Runtime );

    return Html5Runtime;
} );