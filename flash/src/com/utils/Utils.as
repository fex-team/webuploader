package com.utils
{
    public class Utils
    {
        static public function trim(str:String) : String
        {
            if (!str) return '';

            return str.replace(/^\s+/, '').replace(/\s+$/, '');
        }


        static public function sanitize(str:String) : String
        {
            // allow only [a-zA-Z0-9_]
            return str.replace(/[^\w]/g, '');
        }


        static private var _guidCounter:uint = 0;

        static public function guid(prefix:String = '') : String
        {
            var guid:String = new Date().getTime().toString(32), i:int;

            for (i = 0; i < 5; i++) {
                guid += Math.floor(Math.random() * 65535).toString(32);
            }

            return (prefix || 'o_') + guid + (_guidCounter++).toString(32);
        }


        static public function extend(obj1:*, obj2:*, strict:Boolean = false, propsOnly:Boolean = true) : *
        {
            if (!obj1)
                obj1 = {};

            for (var key:String in obj2) {
                if (propsOnly && obj2[key] is Function)
                    continue;

                if (strict) {
                    if (obj1.hasOwnProperty(key))
                        obj1[key] = obj2[key];
                } else {
                    obj1[key] = obj2[key];
                }
            }
            return obj1;
        }


        static public function isTrue(value:String) : Boolean
        {
            if (!value) return false;

            return ['1', 'true'].indexOf(value.toLowerCase()) !== -1 ? true : false;
        }


        static public function isFalse(value:String) : Boolean
        {
            return !Utils.isTrue(value);
        }


        static public function toHHIISS(seconds:Number) : String
        {
            var h:Number, i:Number, s:Number,
            HHIISS:String,

            padZero:Function = function(number:uint) : String {
                return number > 9 ? number.toString() : '0' + number.toString();
            };

            s = seconds % 60;
            i = Math.floor((seconds % 3600) / 60);
            h = Math.floor(seconds / (3600));

            HHIISS = padZero(s);
            HHIISS = (i > 0 ? padZero(i) : '00') + ':' + HHIISS;
            if (h > 0)
                HHIISS = padZero(h) + ':' + HHIISS;

            return HHIISS;
        }

        static public function isEmptyObj(o:Object) : Boolean {
            var prop:*;

            if (!o) {
                return true;
            }

            for (prop in o) {
                return false;
            }
            return true;
        }

    }
}