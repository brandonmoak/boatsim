const path = require('path');

module.exports = function override(config) {
    // Add shared folder alias
    config.resolve.alias = {
        ...config.resolve.alias,
        '@shared': path.resolve(__dirname, '../shared')
    };

    // Simple YAML loader configuration
    config.module.rules.push({
        test: /\.ya?ml$/,
        use: 'yaml-loader',
        type: 'javascript/auto'  // This tells webpack to not try to parse as JSON
    });

    return config;
}; 