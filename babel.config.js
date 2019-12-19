module.exports = api => {
  const isTest = api.env('test');
  const isDev = api.env('development');

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          debug: isDev,
          spec: true,
          useBuiltIns: 'usage',
          modules: isTest ? 'auto' : false,
          targets: {
            node: 'current',
            browsers: [
              'last 3 versions and > 1%',
              'not ie 11',
              'not dead',
            ],
          },
          corejs: 3,
        },
      ],
    ],
    plugins: [
      [
        '@babel/plugin-proposal-class-properties',
        {
          spec: true,
        },
      ],
      '@babel/plugin-proposal-object-rest-spread',
    ],
  };
};
