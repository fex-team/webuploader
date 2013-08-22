/**
 * @fileOverview  jq-bridge 主要实现像jQuery一样的功能方法，可以选择性的换成jQuery或者Zepto
 *
 */
var document = window.document,
    emptyArray = [],
    slice = emptyArray.slice,
    rId = /^#(.*)$/;

function each( obj, iterator ) {
    var i;

    // like array
    if ( typeof obj.length === 'number' ) {
        for ( i = 0; i < obj.length; i++ ) {
            if ( iterator.call( obj[ i ], i, obj[ i ] ) === false ) {
                return obj;
            }
        }
    } else {
        for ( i in obj ) {
            if ( obj.hasOwnProperty( i ) && iterator.call( obj[ i ], i,
                    obj[ i ] ) === false ) {
                return obj;
            }
        }
    }

    return obj;
}

function extend( target, source, deep ) {
    each( source, function( key, val ) {
        if ( deep && typeof target[ key ] === 'object' ) {
            extend( target[ key ], val, deep );
        } else {
            target[ key ] = val;
        }
    } );
}

/**
 * 只支持ID选择。
 * @param  {[type]} selector [description]
 * @return {[type]}          [description]
 */
function $( elem ) {
    elem = typeof elem === 'string' && rId.test( elem ) ?
            document.getElementById( RegExp.$1 ) : elem;

    return {

        /**
         * 添加className
         */
        addClass: function( classname ) {
            elem.className += classname;
            return this;
        }
    }
}

$.each = each;
$.extend = function( /*[deep, ]*/target/*, source...*/ ) {
    var args = slice.call(arguments, 1),
        deep;

    if ( typeof target === 'boolean' ) {
        deep = target;
        target = args.shift();
    }

    args.forEach(function( arg ) {
        extend( target, arg, deep );
    });

    return target;
}

emptyArray = null;
WU.$ = $;