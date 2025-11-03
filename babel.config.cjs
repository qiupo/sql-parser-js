/**
 * Babel Configuration
 * 
 * Configuration for JavaScript transpilation and module handling
 */

module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: '14',
                browsers: ['> 1%', 'last 2 versions', 'ie >= 11']
            },
            modules: false, // Let webpack handle modules
            useBuiltIns: 'usage',
            corejs: 3
        }]
    ],
    
    plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator'
    ],
    
    env: {
        test: {
            presets: [
                ['@babel/preset-env', {
                    targets: {
                        node: 'current'
                    },
                    modules: 'commonjs' // Use CommonJS for Jest
                }]
            ]
        },
        
        development: {
            plugins: [
                // Add development-specific plugins if needed
            ]
        },
        
        production: {
            plugins: [
                // Add production optimizations
                ['transform-remove-console', {
                    exclude: ['error', 'warn']
                }]
            ]
        }
    }
};