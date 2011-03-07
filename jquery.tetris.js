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
		var $element = $(element);

		$.extend(this, {
			element: element,
			$element: $element,
            frozen: {}
		}, options);

        this.generateTile();

        $element
            .css({
	            width: this.cols * this.tileSize,
	        	height: this.rows * this.tileSize
	        })
            .bind({
                repaint: $.proxy(this.repaint, this),
                tick: $.proxy(this.tick, this),
                tileDrop: $.proxy(this.drop, this)
            })
            .trigger('repaint');
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
        tick: function() {
            this.down();
            this.$element.trigger('repaint');
        },
        drop: function() {
            this.freeze(this.currentTile);
    
            this.$element.find('.current').remove();
    
            this.generateTile();

            if (!isFreePosition(this.currentTile.shape, this.frozen)) {
                this.$element.trigger('gameOver');
            }
        },
        rotate: function() {
            var currentTile = this.currentTile,
                directions, rotation, center;
            
            if (currentTile.shapeStates) {
                
                var rotation = currentTile.shapeStates[currentTile.shapeStateIndex];
                for (var i = 0; i < currentTile.shape.length; i++) {
                    currentTile.shape[i] += rotation[i];
                }

                currentTile.shapeStateIndex = (++currentTile.shapeStateIndex) % currentTile.shapeStates.length;
            } else if (currentTile.shapeRotation) {
                currentTile.shape = currentTile.shapeRotation(currentTile.shape);
            }

            this.$element.trigger('repaint');
        },
        down: function() {
            var cols = this.cols,
                maxStageIndex = cols * this.rows,
                shape = this.currentTile.shape,
                newLocation = $.map(shape, function(x) { return x + cols; }),
                isNewLocationOutOfLevel = $.grep(newLocation, function(x) { return x >= maxStageIndex; }).length > 0;

            if (!isNewLocationOutOfLevel && isFreePosition(newLocation, this.frozen)) {
                this.currentTile.shape = newLocation;
                this.$element.trigger('repaint');
            } else {
                this.$element.trigger('tileDrop');
            }
        },
        generateTile: function(type) {
            // build shape cache
            var cols = this.cols,
                center = Math.floor(cols/2),
                direction = [-cols, +1, +cols, -1];

            function squareRotation(shape) {
                var directions = [-cols-1, -cols, -cols+1,
                                       -1,     0,      +1,
                                  +cols-1, +cols, +cols+1],
                    rotation = [-cols+1, +1, +cols+1,
                                -cols  ,  0, +cols,
                                -cols-1, -1, +cols-1],
                    center = shape[0];

                return $.map(shape, function(coord) {
                    for (var i = 0; i < directions.length; i++) {
                        if (coord == center + directions[i]) {
                            return center + rotation[i];
                        }
                    }
                });
            }

            if (!this.tileCache) {
                this.tileCache = [
                    {
                        type: 'O',
                        shape: [ center, center+1, center+direction[0], center+direction[0]+1 ]
                    },
                    {
                        type: 'J',
                        shape: [ center, center-1, center+1, center-1+direction[0] ],
                        shapeRotation: squareRotation
                    },
                    {
                        type: 'L',
                        shape: [ center, center-1, center+1, center+1+direction[0] ],
                        shapeRotation: squareRotation
                    },
                    {
                        type: 'I',
                        shape: [ center-1, center, center+1, center+2 ],
                        shapeStates: [
                            [+2-cols, +1, +cols, +2*cols-1],
                            [+1+2*cols, +cols, -1, -2-cols],
                            [-2+cols, -1, -cols, -2*cols+1],
                            [-1-2*cols, -cols, +1, +2+cols]
                        ],
                        shapeStateIndex: 0
                    },
                    {
                        type: 'S',
                        shape: [ center, center-1, center+direction[0], center+direction[0]+1 ],
                        shapeRotation: squareRotation
                    },
                    {
                        type: 'Z',
                        shape: [ center, center+1, center+direction[0], center+direction[0]-1 ],
                        shapeRotation: squareRotation
                    },
                    {
                        type: 'T',
                        shape: [ center, center-1, center+1, center+direction[0] ],
                        shapeRotation: squareRotation
                    }
                ];
            }

            if (typeof type != 'undefined') {
                for (var i = 0; i < this.tileCache.length; i++) {
                    if (this.tileCache[i].type == type) {
                        tileIndex = i;
                        break;
                    }
                }
            } else {
                //TODO: implement Random Generator (http://tetris.wikia.com/wiki/Random_Generator)
                tileIndex = Math.floor(Math.random() * this.tileCache.length);
            }

            this.currentTile = $.extend({}, this.tileCache[tileIndex], { shapeLocation: squareRotation });
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
        },
        start: function() {
            var $element = this.$element;

            if (!isFreePosition(this.currentTile.shape, this.frozen)) {
                $element.trigger('gameOver');
            }


           /// TODO: improve timer
           this.timer = setInterval(function() {
               $element.trigger('tick');
           }, 600);

           $(document).bind('keydown', $.proxy(this.keyDown, this));
        },
        pause: function() {
            if (this.timer) {
                window.clearInterval(this.timer);
                this.timer = null;
            }
        }
	};
})(jQuery);
