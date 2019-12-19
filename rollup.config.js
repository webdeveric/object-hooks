import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';

const isProd = process.env.NODE_ENV === 'production';

export default {
  input: 'src/objectHooks.js',
  output: {
    name: 'objectHooks',
    file: 'dist/objectHooks.js',
    format: 'umd',
    sourcemap: ! isProd,
  },
  plugins: [
    resolve({
      extensions: [ '.js' ],
    }),
    commonjs({
      include: [ './src/*', 'node_modules/**' ],
    }),
    eslint({
      include: 'src/**/*.js',
    }),
    babel({
      exclude: 'node_modules/**',
    }),
    ( isProd && terser() ),
    filesize(),
  ],
  watch: {
    exclude: [ 'node_modules/**' ],
  },
};
