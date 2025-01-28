const path = require('path');

module.exports = function override(config, env) {
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

    return config;
}; 