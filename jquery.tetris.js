    // jQuery Tetris plug-in
// by Alexander Gyoshev (http://blog.gyoshev.net/)
// licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License. (http://creativecommons.org/licenses/by-sa/3.0/)
(function($) {
    // jQuery plug-in
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

	tetris.defaults = {
		rows: 18,
		cols: 12,
		tileSize: 16
	};

    // Tetris implementation
	var impl = tetris.implementation = function(element, options) {
		var $element = $(element), self = this;

		$.extend(this, {
			element: element,
			$element: $element,
            frozen: {}
		}, options);

        this.generateTile();

		$element
            .bind({
                repaint: $.proxy(this.repaint, this),
                tick: function() {
                    self.down();
                    $element.trigger('repaint');
                },
                tileDrop: function() {
                    var currentTile = self.currentTile;

                    self.freeze(self.currentTile);

                    self.generateTile();
                }
            })
            .css({
			    width: this.cols * this.tileSize,
			    height: this.rows * this.tileSize
		    })
            .trigger('repaint');

        /// TODO: improve timer
        this.timer = setInterval(function() {
            $element.trigger('tick');
        }, 600);

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
            var cols = this.cols,
                newLocation = $.map(this.currentTile, function(x) { return x + modifier; }),
                isNewLocationOutOfLevel = false;

            for (var i = 0; i < newLocation.length; i++) {
                if (newLocation[i] < 0 || (newLocation[i] % cols) != ((this.currentTile[i] % cols) + modifier)) {
                    isNewLocationOutOfLevel = true;
                }
            }
                
            if (!isNewLocationOutOfLevel) {
                this.currentTile = newLocation;
                this.$element.trigger('repaint');
            }
        },
        rotate: function() {
        },
        down: function() {
            var cols = this.cols,
                maxStageIndex = cols * this.rows,
                newLocation = $.map(this.currentTile, function(x) { return x + cols; }),
                isNewLocationOutOfLevel = $.grep(newLocation, function(x) { return x > maxStageIndex; }).length > 0;

            if (!isNewLocationOutOfLevel) {
                this.currentTile = newLocation;
                this.$element.trigger('repaint');
            } else {
                this.$element.trigger('tileDrop');
            }
        },
        generateTile: function() {
            var self = arguments.callee,
                cols = this.cols,
                center;

            if (!self.cache) {
                // build shape cache
                direction = [ -cols, +1, +cols, -1];
                center = Math.floor(cols/2);

                // shapes
                self.cache = [
                    [ center, center+1, center+direction[0], center+direction[0]+1 ],              // O
                    [ center, center+direction[0], center+2*direction[0], center+3*direction[0] ], // I
                    [ center, center-1, center+direction[0], center+2*direction[0] ],              // J
                    [ center, center+1, center+direction[0], center+2*direction[0] ],              // L
                    [ center, center+1, center+direction[0], center+direction[0]-1 ],              // Z
                    [ center, center-1, center+direction[0], center+direction[0]+1 ],              // S
                    [ center, center+direction[0], center+direction[0]-1, center+direction[0]+1 ]  // T
                ];
            }

            this.currentTile = self.cache[Math.floor(Math.random() * self.cache.length)];
            this.currentTile = $.map(this.currentTile, function(x) { return x + 3*cols });
        },
        freeze: function(tile) {
            var frozenTilesHtml = [],
                tileSize = this.tileSize,
                cols = this.cols;

            for (var i = 0; i < tile.length; i++) {
                this.frozen[tile[i]] = true;
                frozenTilesHtml.push('<div class="tile frozen" />');
            }

            $(frozenTilesHtml.join(''))
                .each(function(i) {
                    $(this).css({
                        left: (tile[i] % cols) * tileSize,
                        top: Math.floor(tile[i] / cols) * tileSize
                    });
                })
                .appendTo(this.element);
        },
        repaint: function() {
            var cols = this.cols,
                tileSize = this.tileSize,
                currentTile = this.$element.find('.current');

            if (currentTile.length == 0) {
                // render new tile
                var currentTileHtml = [];

                for (var h = 0; h < this.currentTile.length; h++) {
                    currentTileHtml.push('<div class="tile current" />');
                }

                currentTile = this.$element.append(currentTileHtml.join('')).find('.current');
            }

            // position current tile
            for (var i = 0; i < this.currentTile.length; i++) {
                currentTile.eq(i).css({
                    left: (this.currentTile[i] % cols) * tileSize,
                    top: Math.floor(this.currentTile[i] / cols) * tileSize
                });
            }
        }
	};
})(jQuery);
