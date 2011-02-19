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

        this.generateTile();

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
            var cols = this.cols;

            this.currentTile = $.map(this.currentTile, function(x) { return x + cols });

            this.$element.trigger('repaint');
        },
        generateTile: function() {
            var cols = this.cols,
                newTile = [Math.floor(cols/2),0,0,0],
                anchor, side,
                sides = [-cols,+1,+cols,-1];

            for (var i = 1; i < newTile.length; i++) {
                anchor = newTile[Math.floor(Math.random() * i)];

                do {
                    side = Math.floor(Math.random() * 4);
                } while ($.inArray(anchor + sides[side], newTile) != -1);

                newTile[i] = anchor + sides[side];
            }

            this.currentTile = newTile;
        },
        repaint: function() {
            $.each(this.currentTile, function() {
                $('<div class="tile" />')
                    .css({
                        left: (this % options.cols) * options.tileSize,
                        top: Math.floor(this / options.cols) * options.tileSize
                    })
                    .appendTo(element);
            });
        }
	};

	tetris.defaults = {
		rows: 18,
		cols: 12,
		tileSize: 16
	};
})(jQuery);
