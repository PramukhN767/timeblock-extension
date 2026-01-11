const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'production',  
  devtool: false,      

  entry: {
    popup: './src/popup/index.jsx'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                modules: 'auto',             
                targets: {
                  chrome: '88'               
                }
              }],
              '@babel/preset-react'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  resolve: {
    extensions: ['.js', '.jsx']
  },
  
  plugins: [
    new Dotenv({
      systemvars: true  
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup.html', to: 'popup.html' },
        { from: 'background', to: 'background' },
        { from: 'assets', to: 'assets' }
      ]
    })
  ]
};