/**
 * Rollup Configuration
 * 
 * Alternative bundler configuration for ES modules and optimized builds
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 * 
 * @author ${pkg.author}
 * @license ${pkg.license}
 */`;

const createConfig = (format, minify = false) => {
    // 为CommonJS格式使用.cjs扩展名
    const extension = format === 'cjs' ? 'cjs' : 'js';
    
    return {
        input: 'src/index.js',
        
        output: {
            file: `dist/sql-parser.${format}${minify ? '.min' : ''}.${extension}`,
            format,
            name: format === 'umd' ? 'SQLParser' : undefined,
            banner,
            sourcemap: true,
            exports: 'named'
        },
    
    plugins: [
        resolve({
            browser: format === 'umd',
            preferBuiltins: format !== 'umd'
        }),
        
        commonjs(),
        
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**',
            presets: [
                ['@babel/preset-env', {
                    targets: format === 'umd' ? 
                        { browsers: ['> 1%', 'last 2 versions'] } :
                        { node: '14' },
                    modules: false
                }]
            ]
        }),
        
        ...(minify ? [
            terser({
                compress: {
                    drop_console: true,
                    drop_debugger: true
                },
                mangle: {
                    reserved: ['SQLParser', 'parseSQL', 'validateSQL', 'extractTables', 'extractColumns']
                },
                format: {
                    comments: /^!/
                }
            })
        ] : [])
    ],
    
    external: format === 'umd' ? [] : ['fs', 'path', 'util']
    };
};

export default [
    // ES Module build
    createConfig('es'),
    createConfig('es', true),
    
    // CommonJS build
    createConfig('cjs'),
    createConfig('cjs', true),
    
    // UMD build for browsers
    createConfig('umd'),
    createConfig('umd', true)
];