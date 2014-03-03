/**
 * @fileOverview  jq-bridge 主要实现像jQuery一样的功能方法，可以替换成jQuery，
 * 这里只实现了此组件所需的部分。
 *
 * **此文件的代码还不可用，还是直接用jquery吧**
 * @beta
 */
define(function() {
    var doc = window.document,
        emptyArray = [],
        slice = emptyArray.slice,
        class2type = {},
        hasOwn = class2type.hasOwnProperty,
        toString = class2type.toString,
        rId = /^#(.*)$/;

    function each( obj, iterator ) {
        var i;

        // like array
        if ( typeof obj !== 'function' && typeof obj.length === 'number' ) {
            for ( i = 0; i < obj.length; i++ ) {
                if ( iterator.call( obj[ i ], i, obj[ i ] ) === false ) {
                    return obj;
                }
            }
        } else {
            for ( i in obj ) {
                if ( hasOwn.call( obj, i ) && iterator.call( obj[ i ], i,
                        obj[ i ] ) === false ) {
                    return obj;
                }
            }
        }

        return obj;
    }

    function extend( target, source, deep ) {
        each( source, function( key, val ) {
            if ( deep && typeof val === 'object' ) {
                if ( typeof target[ key ] !== 'object' ) {
                    target[ key ] = type( val ) === 'array' ? [] : {};
                }
                extend( target[ key ], val, deep );
            } else {
                target[ key ] = val;
            }
        });
    }

    each( ('Boolean Number String Function Array Date RegExp Object' +
            ' Error').split(' '), function( i, name ) {
        class2type[ '[object ' + name + ']' ] = name.toLowerCase();
    });

    function setAttribute( node, name, value ) {
        value == null ? node.removeAttribute( name ) :
                node.setAttribute( name, value );
    }

    /**
     * 只支持ID选择。
     */
    function $( elem ) {
        var api = {};

        elem = typeof elem === 'string' && rId.test( elem ) ?
                doc.getElementById( RegExp.$1 ) : elem;

        if ( elem ) {
            api[ 0 ] = elem;
            api.length = 1;
        }

        return $.extend( api, {
            _wrap: true,

            get: function() {
                return elem;
            },

            /**
             * 添加className
             */
            addClass: function( classname ) {
                elem.classList.add( classname );
                return this;
            },

            removeClass: function( classname ) {
                elem.classList.remove( classname );
                return this;
            },

            html: function( html ) {
                if ( html ) {
                    elem.innerHTML = html;
                }
                return elem.innerHTML;
            },

            attr: function( key, val ) {
                if ( $.isObject( key ) ) {
                    $.each( key, function( k, v ) {
                        setAttribute( elem, k, v );
                    });
                } else {
                    setAttribute( elem, key, val );
                }
            },

            empty: function() {
                elem.innerHTML = '';
                return this;
            },

            before: function( el ) {
                elem.parentNode.insertBefore( el, elem );
            },

            append: function( el ) {
                el = el._wrap ? el.get() : el;
                elem.appendChild( el );
            },

            text: function() {
                return elem.textContent;
            },

            // on
            on: function( type, fn ) {
                if ( elem.addEventListener ) {
                    elem.addEventListener( type, fn, false );
                } else if ( elem.attachEvent ) {
                    elem.attachEvent( 'on' + type, fn );
                }

                return this;
            },

            // off
            off: function( type, fn ) {
                if ( elem.removeEventListener ) {
                    elem.removeEventListener( type, fn, false );
                } else if ( elem.attachEvent ) {
                    elem.detachEvent( 'on' + type, fn );
                }
                return this;
            }

        });
    }

    $.each = each;
    $.extend = function( /*[deep, ]*/target/*, source...*/ ) {
        var args = slice.call( arguments, 1 ),
            deep;

        if ( typeof target === 'boolean' ) {
            deep = target;
            target = args.shift();
        }

        args.forEach(function( arg ) {
            arg && extend( target, arg, deep );
        });

        return target;
    };

    function type( obj ) {

        /*jshint eqnull:true*/
        return obj == null ? String( obj ) :
                class2type[ toString.call( obj ) ] || 'object';
    }
    $.type = type;
    $.isWindow = function( obj ) {
        return obj && obj.window === obj;
    };

    $.isPlainObject = function( obj ) {
        if ( type( obj ) !== 'object' || obj.nodeType || $.isWindow( obj ) ) {
            return false;
        }

        try {
            if ( obj.constructor && !hasOwn.call( obj.constructor.prototype,
                    'isPrototypeOf' ) ) {
                return false;
            }
        } catch ( ex ) {
            return false;
        }

        return true;
    };

    $.isObject = function( anything ) {
        return type( anything ) === 'object';
    };

    $.trim = function( str ) {
        return str ? str.trim() : '';
    };

    $.isFunction = function( obj ) {
        return type( obj ) === 'function';
    };

    emptyArray = null;

    return $;
});
