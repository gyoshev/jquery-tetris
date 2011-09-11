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
        rows: 22,
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

        this.currentTile = this.generateTile();

        $element
            .css({
                width: this.cols * this.tileSize,
                height: this.rows * this.tileSize
            })
            .bind({
                repaint: $.proxy(this.repaint, this),
                tick: $.proxy(this.tick, this),
                tileDrop: $.proxy(this.tileDrop, this),
                rowCompleted: $.proxy(this.rowCompleted, this)
                /// TODO: handle gameOver event with dignity
            })
            .trigger('repaint');
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
        tick: function() {
            this.down();
            this.$element.trigger('repaint');
        },
        tileDrop: function() {
            this.freeze(this.currentTile);

            this.$element.find('.current').remove();

            this.currentTile = this.generateTile();

            if (!this.isValidLocation(this.currentTile.shape)) {
                this.$element.trigger('gameOver');
            }
        },
        rowCompleted: function(e, rowStart) {
            var cols = this.cols,
                tileSize = this.tileSize;

            this.$element.find('.frozen')
                .filter(function() {
                    var index = $(this).data('index');
                    return index - (index % cols) == rowStart;
                })
                .remove()
                .end()
                .filter(function() {
                    var index = $(this).data('index');
                    if (index - (index % cols) < rowStart)
                    return index - (index % cols) < rowStart;
                })
                .css('top', function() {
                    return parseInt($(this).css('top')) + tileSize;
                })
                .each(function() {
                    var t = $(this);
                    t.data('index', t.data('index') + cols);
                });

            for (var i = rowStart; i < rowStart + cols; i++) {
                delete this.frozen[i];
            }

            for (var i = rowStart-1; i >= 0; i--) {
                if (this.frozen[i]) {
                    this.frozen[i + cols] = true;
                    delete this.frozen[i];
                }
            }
        },
        isValidLocation: function(location) {
            var cols = this.cols,
                maxStageIndex = cols * this.rows;

            for (var i = 0; i < location.length; i++) {
                if (location[i] < 0
                    || location[i] >= maxStageIndex
                    || this.frozen[location[i]]) {
                    return false;
                }

                for (var j = 0; j < i; j++) {
                    if (((location[i] % cols == 0) && (location[j] % cols == cols - 1))
                     || ((location[i] % cols == cols - 1) && (location[j] % cols == 0)))
                        return false;
                }
            }

            return true;
        },
        move: function(modifier) {
            var cols = this.cols,
                shape = this.currentTile.shape,
                newLocation = $.map(shape, function(x) {
                    return x + modifier;
                }),
                hitsEdge = false;

            for (var i = 0; i < shape.length; i++) {
                if ((modifier < 0 && shape[i] % cols == 0)
                 || (modifier > 0 && shape[i] % cols == cols - 1)) {
                    hitsEdge = true;
                }
            }

            if (!hitsEdge && this.isValidLocation(newLocation)) {
                this.currentTile.shape = newLocation;
                this.$element.trigger('repaint');
            }
        },
        rotate: function() {
            var currentTile = this.currentTile,
                newLocation = currentTile.shape.slice();

            if (currentTile.shapeStates) {
                var rotation = currentTile.shapeStates[currentTile.shapeStateIndex];

                newLocation = $.map(newLocation, function(x, index) { return x + rotation[index]; });

            } else if (currentTile.shapeRotation) {
                newLocation = currentTile.shapeRotation(newLocation);
            }

            if (this.isValidLocation(newLocation)) {
                currentTile.shape = newLocation;
                if (currentTile.shapeStates) {
                    currentTile.shapeStateIndex = (++currentTile.shapeStateIndex) % currentTile.shapeStates.length;
                }
            }

            this.$element.trigger('repaint');
        },
        down: function() {
            var cols = this.cols,
                maxStageIndex = cols * this.rows,
                shape = this.currentTile.shape,
                newLocation = $.map(shape, function(x) { return x + cols; });

            if (this.isValidLocation(newLocation)) {
                this.currentTile.shape = newLocation;
                this.$element.trigger('repaint');
            } else {
                this.$element.trigger('tileDrop');
            }
        },
        generateTile: function(type) {
            // build shape cache
            var cols = this.cols,
                center = Math.floor(cols/2) + cols,
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
                /// TODO: allow extensibility for custom tiles
                /// TODO: move this somewhere else
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
                // Random Generator using Knuth shuffle (http://tetris.wikia.com/wiki/Random_Generator)
                if (!this.randomBag || this.randomBag.length == 0) {
                    var tilesCount = this.tileCache.length;
                    this.randomBag = [];

                    for (var i = 0; i < tilesCount; i++) {
                        this.randomBag[i] = i;
                    }

                    for (var i = tilesCount - 1; i > 0; i--) {
                        var rand = Math.floor(Math.random() * i),
                            tmp = this.randomBag[rand];
                        this.randomBag[rand] = this.randomBag[i];
                        this.randomBag[i] = tmp;
                    }
                }

                tileIndex = this.randomBag.shift();
            }

            return $.extend({}, this.tileCache[tileIndex], { shapeLocation: squareRotation });
        },
        freeze: function(tile) {
            var frozenTilesHtml = [],
                shape = tile.shape,
                tileSize = this.tileSize,
                cols = this.cols,
                rowsToCheck = [];

            for (var i = 0; i < shape.length; i++) {
                if ($.inArray(shape[i] - (shape[i] % cols), rowsToCheck) === -1) {
                    rowsToCheck.push(shape[i] - (shape[i] % cols));
                }

                this.frozen[shape[i]] = true;
                frozenTilesHtml.push('<div class="tile frozen type-' + tile.type + '" />');
            }

            $(frozenTilesHtml.join(''))
                .each(function(i) {
                    $(this).css({
                        left: (shape[i] % cols) * tileSize,
                        top: Math.floor(shape[i] / cols) * tileSize
                    })
                    .data('index', shape[i]);
                })
                .appendTo(this.element);

            while (rowsToCheck.length) {
                var rowStart = rowsToCheck.shift(),
                    broken = false;

                for (var i = rowStart; i < rowStart + cols; i++) {
                    if (!this.frozen[i])
                        broken = true;
                }

                if (!broken) {
                    this.$element.trigger('rowCompleted', rowStart);
                }
            }
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

            if (!this.isValidLocation(this.currentTile.shape)) {
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
