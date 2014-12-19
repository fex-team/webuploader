package com
{
	import com.events.FilePickerEvent;

	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.net.FileFilter;
	import flash.net.FileReference;
	import flash.net.FileReferenceList;
	import com.utils.Utils;

	public class FilePicker extends Sprite
	{
		public static var dispatches:Object = { // hash of events dispatched by this class
			"Cancel": FilePickerEvent.CANCEL,
			"Change": FilePickerEvent.SELECT,
			"DialogOpen": FilePickerEvent.OPEN,
			"MouseEnter": MouseEvent.ROLL_OVER,
			"MouseLeave": MouseEvent.ROLL_OUT,
			"MouseDown": MouseEvent.MOUSE_DOWN,
			"MouseUp": MouseEvent.MOUSE_UP
		};

		public static var stageOccupied:Boolean = false;

		protected var _options:Object = {};

		protected var _disabled:Boolean = false;

		protected var _filters:Array = null;

		protected var _picker:*;

		protected var _button:Sprite;

		protected var _files:Array = [];

		public function init(options:Object = null) : void {
			_options = Utils.extend({
				name: 'Filedata',
				multiple: false,
				accept: null
			}, options);


			if (_options.accept !== null) {
				_filters = [];

				for (var i:int = 0; i < _options.accept.length; i++) {
					_filters.push(new FileFilter(
						_options.accept[i].title,
						'*.' + _options.accept[i].extensions.replace(/,/g, ";*.")
					));
				}
			}

			_button = new Sprite;

			_button.graphics.beginFill(0x000000, 0); // Fill with transparent color
			_button.graphics.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
			_button.graphics.endFill();
			_button.buttonMode = true;
			_button.useHandCursor = true;

			_button.addEventListener(MouseEvent.CLICK, onClick);
			_button.addEventListener(MouseEvent.ROLL_OVER, onEvent);
			_button.addEventListener(MouseEvent.ROLL_OUT, onEvent);
			_button.addEventListener(MouseEvent.MOUSE_DOWN, onEvent);
			_button.addEventListener(MouseEvent.MOUSE_UP, onEvent);

			addChild(_button);
		}


		public function disable(disabled:Boolean = true) : void {
			_disabled = disabled;
			_button.useHandCursor = !disabled;
		}


		public function destroy() : void {

		}


		private function onEvent(e:MouseEvent) : void {
			e.stopPropagation();

			if (_disabled) {
				return;
			}

			dispatchEvent(e);
		}


		private function onClick(e:MouseEvent) : void {
			if (_disabled) {
				return;
			}

			_picker = _options.multiple ? new FileReferenceList : new FileReference;

			_picker.addEventListener(Event.CANCEL, onDialogEvent);
			_picker.addEventListener(Event.SELECT, onDialogEvent);
			_picker.browse(_filters);
			dispatchEvent(new FilePickerEvent(FilePickerEvent.OPEN));
		}


		public function getFiles() : Array {
			var files:Array = [];

			for each (var file:File in _files) {
				Uploader.compFactory.add(file.uid, file);
				files.push(file.toObject());
			}
			return files;
		}


		private function onDialogEvent(e:Event) : void {
			_picker.removeEventListener(Event.CANCEL, onDialogEvent);
			_picker.removeEventListener(Event.SELECT, onDialogEvent);

			switch (e.type) {

				case Event.CANCEL:
					dispatchEvent(new FilePickerEvent(FilePickerEvent.CANCEL));
					break;

				case Event.SELECT:
					var fileRefList:Array = [];

					if (!_options.multiple) {
						fileRefList.push(_picker);
					} else {
						fileRefList = _picker.fileList;
					}

					_files = [];

					for (var i:uint = 0; i < fileRefList.length; i++) {
						_files.push(new File([fileRefList[i]]));
					}

					dispatchEvent(new FilePickerEvent(FilePickerEvent.SELECT));
					break;
			}


		}
	}
}