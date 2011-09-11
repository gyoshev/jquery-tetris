# jQuery Tetris plug-in

This plug-in converts a `<div>` into a tetris playground:

    <div id="tetris"></div>

    $("#tetris").tetris();

I strived to follow the [Tetris Guideline](http://tetris.wikia.com/wiki/Tetris_Guideline) where reasonable, although I tend to call the tetrads "tiles" in the code :)

## Options

- `rows` (default: 22) - number of rows in the tetris area
- `cols` (default: 10) - number of columns in the tetris area
- `tileSize` (default: 16) - the size of a tile (tetrad).

## Events

- `tileDrop` - fires when a the current tile has been dropped into place
- `rowCompleted` - fires when a row has been completed and is about to be removed
- `gameOver` - fired when a newly generated tile collides with an existing tile
- `repaint` - fired when the tile positions are recalculated (pretty much all the time)

## Styling

All tiles are rendered through the DOM, so you can style them with juicy CSS3. Yum!

## Building

To build a minified version, you need [nodejs](http://nodejs.org/). Just run `node build/jquery-tetris.js` and the jquery.tetris.min.js will appear.

## ToDos

- Show next tile
- Smooth transitions
- Allow customization of tiles

## License

Licensed under a [Creative Commons Attribution-ShareAlike 3.0 Unported License](http://creativecommons.org/licenses/by-sa/3.0/).
