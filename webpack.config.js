const path = require('path');
// const glob = require("glob");
const webpack = require("webpack");

// Add WTF code
// let entries = {
// 	wtf: glob.sync(path.resolve(__dirname, "obj", "*.js"))
// };

module.exports = {
	entry: path.join(__dirname, "entry.js"),
	// devtool: "source-map",
	output: {
		path: path.resolve(__dirname, "dst"),
		filename: 'wtf.pack.js',
		library: "wtf",
		libraryTarget: "var"
	},
	mode: "production"
};
