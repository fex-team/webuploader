package
{
    import com.errors.RuntimeError;
    import com.events.OProgressEvent;
    import com.utils.Utils;
    import com.utils.Zhenpin;
    
    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.Event;
    import flash.events.ProgressEvent;
    import flash.external.ExternalInterface;
    import flash.system.Security;
    import flash.ui.ContextMenu;
    import flash.ui.ContextMenuItem;
    import flash.utils.getQualifiedClassName;
    
//    import cmodule.as3_jpeg_wrapper.CLibInit;

    [SWF(width='500', height='500')]
    public class Uploader extends Sprite
    {
        public static var uid:String;

        private var jsReciver:String = "Uploader.reciver";
		
//		private static var clib:Object;

        public static var compFactory:ComponentFactory;

        /**
         * Main constructor for the Uploader class.
         */
        public function Uploader()
        {
            if (stage) {
                _init();
            } else {
                addEventListener(Event.ADDED_TO_STAGE, _init);
            }
        }


        /**
         * Initialization event handler.
         *
         * @param e Event object.
         */
        private function _init(e:Event = null):void
        {
            removeEventListener(Event.ADDED_TO_STAGE, _init);

            // Allow scripting on swf loaded from another domain
			Security.allowDomain("*");

//			var loader:CLibInit = new CLibInit();
//			clib = loader.init();

            // Align and scale stage
            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.EXACT_FIT;
			
			var menu:ContextMenu = new ContextMenu();
			menu.hideBuiltInItems();
			menu.customItems.push(new ContextMenuItem("webuploader v1.0"));//???preprocessor.xml, antä¼???¨æ??°æ??????
			this.contextMenu = menu;

            var params:Object = stage.loaderInfo.parameters;

            // Setup id
            Uploader.uid = Utils.sanitize(params["uid"]);

            // Event dispatcher
            if (params.hasOwnProperty("jsreciver") && /^[\w\.]+$/.test(params["jsreciver"])) {
                jsReciver = params["jsreciver"];
            }
			
			// 整个很重要，用来增加as贞频的。
            // 整个很重要，用来增加as贞频的。
            try {
                Zhenpin.start();
            } catch (err:*) {
                _fireEvent(Uploader.uid, err);
            }

            //ExternalInterface.marshallExceptions = true; // propagate AS exceptions to JS and vice-versa
            ExternalInterface.addCallback('exec', exec);

            // initialize component factory
            Uploader.compFactory = new ComponentFactory;

			_fireEvent(Uploader.uid + "::Ready");
        }


        public function exec(uid:String, compName:String, action:String, args:* = null) : *
        {
            // Uploader.log(arguments);

            uid = Utils.sanitize(uid); // make it safe

            var comp:* = Uploader.compFactory.get(uid),
				ret:*;

            // WebUploader.log([compName, action]);

            try {
				if ( action == 'destroy' ) {
					
					if ( comp.hasOwnProperty(action) ) {
						ret = comp[action].apply(comp, args as Array);
					}
					
					Uploader.compFactory.remove(uid);
					// Uploader.log(['destory', compName, uid]);
					
					return ret;
					
				} else if (!comp) {
                    comp = Uploader.compFactory.create(this, uid, compName);
                }

                // execute the action if available
                if (comp.hasOwnProperty(action)) {
					// Uploader.log([uid, compName, action, args]);
					ret = comp[action].apply(comp, args as Array);
					
					// Uploader.log([uid, compName, action, args, ret]);
                    return ret;
                }

            } catch(err:*) { // re-route exceptions thrown by components (TODO: check marshallExceptions feature)
				// Uploader.log([ getQualifiedClassName(err), compName, action]);
				_fireEvent(uid + "::Exception", { name: getQualifiedClassName(err).replace(/^[^:*]::/, ''), code: err.errorID });
            }
        }


        /**
         * Intercept component events and do some operations if required
         *
         * @param uid String unique identifier of the component throwing the event
         * @param e mixed Event object
         * @param exType String event type in WebUploader format
         */
        public function onComponentEvent(uid:String, e:*, exType:String) : void
        {
            var evt:Object = {};

            switch (e.type)
            {
                case ProgressEvent.PROGRESS:
                case OProgressEvent.PROGRESS:
                    evt.loaded = e.bytesLoaded;
                    evt.total = e.bytesTotal;
                    break;
            }

            evt.type = [uid, exType].join('::');
			// Uploader.log([uid, exType, e.hasOwnProperty('data') ? e.data : null]);
			_fireEvent(evt, e.hasOwnProperty('data') ? e.data : null);
        }
		
//		public static function encodeJpeg(ba:ByteArray, width:uint, height:uint, quality:uint=90 ):ByteArray{
//			return clib.write_jpeg_file(ba, width, height, 3, 2, quality);
//		}



        /**
         * Fires an event from the flash movie out to the page level JS.
         *
         * @param uid String unique identifier of the component throwing the event
         * @param type Name of event to fire.
         * @param obj Object with optional data.
         */
        private function _fireEvent(evt:*, obj:Object = null):void {
            try {
				ExternalInterface.call(jsReciver, evt, obj);
            } catch(err:*) {
				Uploader.log(err);
                //_fireEvent("Exception", { name: 'RuntimeError', message: 4 });

                // throwing an exception would be better here
            }
        }


        public static function log(obj:*) : void {
			ExternalInterface.call('console.log', obj);
        }

    }
}