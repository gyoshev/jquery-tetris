var fs = require("fs"),
    parser = require("./uglify-js/lib/parse-js"),
    uglify = require("./uglify-js/lib/process");

function minify(source) {
    var ast = parser.parse(source);
    ast = uglify.ast_mangle(ast);
    ast = uglify.ast_squeeze(ast);
    return uglify.gen_code(ast);
}

function build() {
    fs.readFile("jquery.tetris.js", "utf8", function(err, data) {
        fs.writeFile("jquery.tetris.min.js", minify(data));
    });
}

// execute immediately, if called directly
if (require.main === module) {
    build();
} else {
// ... or export as build procedure
    exports.build = build;
}
