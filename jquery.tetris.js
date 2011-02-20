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
		rows: 20,
		cols: 10,
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

                    $element.find('.current').remove();

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

    function isFreePosition(position, frozenTiles) {
        for (var i = 0; i < position.length; i++) {
            if (frozenTiles[position[i]]) {
                return false;
            }
        }

        return true;
    }

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
                shape = this.currentTile.shape,
                newLocation = $.map(shape, function(x) { return x + modifier; }),
                isLocationOutOfLevel = false;

            for (var i = 0; i < newLocation.length; i++) {
                if (shape[i] % cols == 0       && modifier < 0
                 || shape[i] % cols == cols -1 && modifier > 0) {
                    isLocationOutOfLevel = true;
                    break;
                }
            }
                
            if (!isLocationOutOfLevel && isFreePosition(newLocation, this.frozen)) {
                this.currentTile.shape = newLocation;
                this.$element.trigger('repaint');
            }
        },
        rotate: function() {
        },
        down: function() {
            var cols = this.cols,
                maxStageIndex = cols * this.rows,
                shape = this.currentTile.shape,
                newLocation = $.map(shape, function(x) { return x + cols; }),
                isNewLocationOutOfLevel = $.grep(newLocation, function(x) { return x > maxStageIndex; }).length > 0;

            if (!isNewLocationOutOfLevel && isFreePosition(newLocation, this.frozen)) {
                this.currentTile.shape = newLocation;
                this.$element.trigger('repaint');
            } else {
                this.$element.trigger('tileDrop');
            }
        },
        generateTile: function() {
            var self = arguments.callee;

            if (!self.cache) {
                // build shape cache
                var cols = this.cols,
                    center = Math.floor(cols/2),
                    direction = [-cols, +1, +cols, -1];

                self.cache = [
                    { type: 'O', shape: [ center, center+1, center+direction[0], center+direction[0]+1 ] },
                    { type: 'J', shape: [ center, center-1, center+direction[0], center+2*direction[0] ] },
                    { type: 'L', shape: [ center, center+1, center+direction[0], center+2*direction[0] ] },
                    { type: 'I', shape: [ center, center+direction[0], center+2*direction[0], center+3*direction[0] ] },
                    { type: 'S', shape: [ center, center-1, center+direction[0], center+direction[0]+1 ] },
                    { type: 'Z', shape: [ center, center+1, center+direction[0], center+direction[0]-1 ] },
                    { type: 'T', shape: [ center, center+direction[0], center+direction[0]-1, center+direction[0]+1 ] }
                ];
            }

            this.currentTile = $.extend({}, self.cache[Math.floor(Math.random() * self.cache.length)]);
        },
        freeze: function(tile) {
            var frozenTilesHtml = [],
                shape = tile.shape,
                tileSize = this.tileSize,
                cols = this.cols;

            for (var i = 0; i < shape.length; i++) {
                this.frozen[shape[i]] = true;
                frozenTilesHtml.push('<div class="tile frozen type-' + tile.type + '" />');
            }

            $(frozenTilesHtml.join(''))
                .each(function(i) {
                    $(this).css({
                        left: (shape[i] % cols) * tileSize,
                        top: Math.floor(shape[i] / cols) * tileSize
                    });
                })
                .appendTo(this.element);
        },
        repaint: function() {
            var cols = this.cols,
                tileSize = this.tileSize,
                shape = this.currentTile.shape,
                currentTile = this.$element.find('.current');

            if (currentTile.length == 0) {
                // render new tile
                var currentTileHtml = [];

                for (var h = 0; h < shape.length; h++) {
                    currentTileHtml.push('<div class="tile current type-' + this.currentTile.type + '" />');
                }

                currentTile = this.$element.append(currentTileHtml.join('')).find('.current');
            }

            // position shape
            for (var i = 0; i < shape.length; i++) {
                currentTile.eq(i).css({
                    left: (shape[i] % cols) * tileSize,
                    top: Math.floor(shape[i] / cols) * tileSize
                });
            }
        }
	};
})(jQuery);
