package
{
    import com.Blob;
    import com.File;
    import com.FilePicker;
    import com.FileReader;
    import com.FileReaderSync;
    import com.Image;
    import com.Md5;
    import com.XMLHttpRequest;
    import com.errors.RuntimeError;
    
    import flash.system.ApplicationDomain;
    import flash.utils.getDefinitionByName;
    import flash.utils.getQualifiedSuperclassName;

    public class ComponentFactory
    {
        FilePicker, Blob, File, FileReader, FileReaderSync, Image, XMLHttpRequest, Md5;

        private var _registry:Object = {};

        public function add(uid:String, comp:*) : void
        {
            if (_registry.hasOwnProperty(uid)) {
                throw new RuntimeError(RuntimeError.COMP_CONFLICT);
            }
            _registry[uid] = comp;
        }


        public function remove(uid:String) : Boolean
        {
            if (!_registry.hasOwnProperty(uid)) {
                return false;
            }
            delete _registry.uid;
            return true;
        }


        public function get(uid:String) : *
        {
            return _registry.hasOwnProperty(uid) ? _registry[uid] : false;
        }


        public function create(uploader:Uploader, uid:String, compName:String) : *
        {
            var compFQName:String, compClass:Class, exType:String, comp:*;

            compFQName = "com." + compName;

            if (ApplicationDomain.currentDomain.hasDefinition(compFQName)) {
                compClass = getDefinitionByName(compFQName) as Class;
                comp = new compClass;

                // if object dispatches events attach event listeners (@see for example FileInput for the interface)
                if (compClass.dispatches) {
                    for (exType in compClass.dispatches) {
                        // new context required to handle this properly
                        (function(type:String, exType:String) : void {
							comp.addEventListener(type, function(e:*) : void {
								uploader.onComponentEvent(uid, e, exType);
                            });
                        }(compClass.dispatches[exType], /*compName + '::' + */exType));
                    }
                }

                // Moxie.log([uid, compName]);

                // if component is descendant of the Sprite, add it to the stage
                if (/Sprite$/.test(getQualifiedSuperclassName(comp))) {
					uploader.addChild(comp);
                }

                if (_registry.hasOwnProperty(uid)) {
                    throw new RuntimeError(RuntimeError.COMP_CONFLICT);
                }
                return (_registry[uid] = comp);
            } else {
                throw new RuntimeError(RuntimeError.NOT_SUPPORTED_ERR);
            }
        }

    }
}