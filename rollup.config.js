import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import del from 'rollup-plugin-delete';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';

const isProd = process.env.NODE_ENV === 'production';

const makeOutput = format => ({
  name: 'ObjectHooks',
  file: `dist/objectHooks.${format}.js`,
  format,
  sourcemap: ! isProd,
});

export default {
  input: 'src/objectHooks.js',
  output: [
    'cjs',
    'esm',
  ].map(makeOutput),
  plugins: [
    del({
      targets: './dist/*',
    }),
    resolve({
      extensions: [ '.js' ],
    }),
    commonjs({
      include: [ 'node_modules/**' ],
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
