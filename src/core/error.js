/**
 * @fileOverview 错误信息
 */
define( 'webuploader/core/error', [], function() {

		return {

			QUEUE: {
				EXCEED_NUM_LIMIT: 101,
				EXCEED_SIZE_LIMIT: 102,
				EMPTY_FILE: 103, 
				INVALID_TYPE: 104
			},

			UPLOAD: {
				HTTP: 201,
				CANCELLED: 202
			}
		};
    }
);