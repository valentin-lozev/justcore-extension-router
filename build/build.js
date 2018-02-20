const fs = require("fs-extra");
const rollup = require("rollup");
const alias = require("rollup-plugin-alias");
const multiEntry = require("rollup-plugin-multi-entry");
const eslint = require("eslint");
const typescript = require("rollup-plugin-typescript2");
const uglify = require("rollup-plugin-uglify");
const path = require("path");
const karma = require("karma");

const name = "justcore-extension-router";
const input = "src/index.ts";
const distFolder = "dist";
const tsOptions = { clean: true };

function runEslint() {
	const cli = new eslint.CLIEngine({
		extensions: [".ts"]
	});
	const report = cli.executeOnFiles(["src/"]);
	const formatter = cli.getFormatter();
	const errorReport = eslint.CLIEngine.getErrorResults(report.results);
	if (errorReport.length > 0) {
		console.log(formatter(errorReport));
		throw "eslint failed";
	} else {
		console.log(formatter(report.results));
	}
}

function copyDefinitions() {
	const definition = `${name}.d.ts`;
	fs.copySync(`src/${definition}`, `${distFolder}/${definition}`);

	console.info("Definitions copied");
}

function bundleUmdDev() {
	return rollup
		.rollup({
			input: input,
			plugins: [
				typescript(tsOptions)
			]
		})
		.then(bundle => {
			return bundle
				.write({
					name: name,
					format: "umd",
					file: `${distFolder}/${name}.umd.js`,
					exports: "named"
				})
				.then(() => console.info("DEV UMD bundled"));
		});
}

function bundleUmdProd() {
	return rollup
		.rollup({
			input: input,
			plugins: [
				typescript(tsOptions),
				uglify({
					mangle: false,
					output: {
						comments: "some"
					}
				})
			]
		})
		.then(bundle => {
			return bundle
				.write({
					name: name,
					format: "umd",
					file: `${distFolder}/${name}.umd.min.js`,
					exports: "named"
				})
				.then(() => console.info("PROD UMD bundled"));
		});
}

function bundleES() {
	return rollup
		.rollup({
			input: input,
			plugins: [
				typescript(tsOptions)
			]
		})
		.then(bundle => {
			return bundle
				.write({
					name: name,
					format: "es",
					file: `${distFolder}/${name}.module.js`
				})
				.then(() => console.info("ES6 bundled"));
		});
}

function bundleTests() {
	return rollup
		.rollup({
			input: "tests/**/*-tests.ts",
			plugins: [
				multiEntry(),
				alias({
					justcore: "bower_components/justcore/dist/justcore.module.js"
				}),
				typescript(tsOptions)
			]
		})
		.then(bundle => {
			return bundle.write({
				format: "iife",
				file: `tests/bundle.js`,
				name: "tests"
			});
		});
}

function runTests() {
	const configPath = path.resolve('./karma.conf.js');
	const config = karma.config.parseConfig(configPath);
	new karma.Server(config).start();
}

function build() {
	Promise.resolve()
		.then(() => fs.removeSync(distFolder))
		.then(() => copyDefinitions())
		.then(() => bundleUmdDev())
		.then(() => bundleUmdProd())
		.then(() => bundleES())
		.then(() => bundleTests())
		.then(() => runTests())
		.catch(reason => console.error(reason));
}

build();