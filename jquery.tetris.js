// jQuery Tetris plug-in
// by Alexander Gyoshev (http://blog.gyoshev.net/)
// licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License. (http://creativecommons.org/licenses/by-sa/3.0/)
(function($) {
	var tetris = $.fn.tetris = function(options) {
		options = $.extend($.fn.tetris.defaults, options);

		return this.each(function() {
			var $this = $(this), instance;
			if (!$this.data("tetris")) {
				instance = new $.fn.tetris.implementation(this, options);
				$this.data("tetris", instance);
			}
		});
	};

	var impl = tetris.implementation = function(element, options) {
		var $element = $(element);

		$.extend(this, {
			element: element,
			$element: $element
		}, options);
	};

    var keys = {
        left: 37,
        up: 38,
        right: 39,
        down: 40
    };

	impl.prototype = {
	};

	tetris.defaults = {
		rows: 18,
		cols: 12,
		tileSize: 16
	};
})(jQuery);
