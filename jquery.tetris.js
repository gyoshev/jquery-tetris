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

		$element
            .css({
			    width: this.cols * this.tileSize,
			    height: this.rows * this.tileSize
		    });

        $(document).bind('keydown', $.proxy(this.keyDown, this));
	};

    var keys = {
        left: 37,
        up: 38,
        right: 39,
        down: 40
    };

	impl.prototype = {
        keyDown: function(e) {
            var code = e.charCode || e.keyCode;

            if (code == keys.left)
                this.move(-1);
            else if (code == keys.up)
                this.rotate();
            else if (code == keys.right)
                this.move(1);
            else if (code == keys.down)
                this.down();
        },
        move: function(modifier) {
        },
        rotate: function() {
        },
        down: function() {
        }
	};

	tetris.defaults = {
		rows: 18,
		cols: 12,
		tileSize: 16
	};
})(jQuery);
