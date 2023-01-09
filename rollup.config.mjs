import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import del from 'rollup-plugin-delete';
import eslint from '@rollup/plugin-eslint';
import externals from 'rollup-plugin-node-externals';
import filesize from 'rollup-plugin-filesize';
import resolve from '@rollup/plugin-node-resolve';

const isProd = process.env.NODE_ENV === 'production';

const makeOutput = ([ format, extension ]) => ({
  name: 'ObjectHooks',
  file: `dist/objectHooks.${extension}`,
  format,
  sourcemap: ! isProd,
});

export default {
  input: 'src/objectHooks.js',
  output: [
    [ 'cjs', 'cjs' ],
    [ 'esm', 'mjs' ],
  ].map(makeOutput),
  plugins: [
    del({
      targets: './dist/*',
    }),
    externals({
      deps: true,
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
      babelHelpers: 'bundled',
    }),
    filesize(),
  ],
  watch: {
    exclude: [ 'node_modules/**' ],
  },
};
