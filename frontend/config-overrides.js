const path = require('path');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');

function override(config, env) {
    // Add shared folder alias
    config.resolve.alias = {
        ...config.resolve.alias,
        '@shared': path.resolve(__dirname, '../shared')
    };

    // Add YAML loader
    config.module.rules.push({
        test: /\.ya?ml$/,
        use: 'yaml-loader',
        type: 'javascript/auto'
    });

    // // Remove ModuleScopePlugin which restricts imports from outside src.
    // config.resolve.plugins = config.resolve.plugins.filter(
    //     (plugin) => !(plugin instanceof ModuleScopePlugin)
    // );

    // // Disable symlink resolution so that hoisted dependencies remain virtually in the workspace.
    // config.resolve.symlinks = false;

    // // Tell webpack to also look in the root's node_modules.
    // config.resolve.modules = [
    //     path.resolve(__dirname, "../node_modules"),
    //     "node_modules",
    // ];

    // // Alias for the hoisted @babel/runtime package.
    // config.resolve.alias["@babel/runtime"] = path.resolve(
    //     __dirname,
    //     "../node_modules/@babel/runtime"
    // );
    // // Add a specific alias for the helpers directory.
    // config.resolve.alias["@babel/runtime/helpers/esm"] = path.resolve(
    //     __dirname,
    //     "../node_modules/@babel/runtime/helpers/esm"
    // );

    // Debug: Log key parts of the resolve configuration.
    console.log("Webpack resolve.modules:", config.resolve.modules);
    console.log("Webpack resolve.alias:", config.resolve.alias);
    console.log("Webpack resolve.symlinks:", config.resolve.symlinks);
    console.log(
        "Webpack resolve.plugins:",
        config.resolve.plugins.map((p) => p.constructor.name)
    );

    return config;
}

module.exports = override; 