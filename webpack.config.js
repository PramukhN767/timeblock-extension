const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',

  devtool: 'cheap-module-source-map',

  entry: {
    popup: './src/popup/index.jsx'
  },
  
  // Output: Where webpack puts the bundle
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',  // [name] = 'popup' from entry
    clean: true  // Clean dist folder before each build
  },
  
  // Module rules: How to process different file types
  module: {
    rules: [
      // Rule 1: Process .js and .jsx files with Babel
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      // Rule 2: Process .css files
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  // Resolve: What file extensions to recognize
  resolve: {
    extensions: ['.js', '.jsx']
  },
  
  // Plugins: Extra processing
  plugins: [
  new CopyPlugin({
    patterns: [
      { from: 'manifest.json', to: 'manifest.json' },
      { from: 'background', to: 'background' },
      { from: 'assets', to: 'assets' },
      { from: 'popup.html', to: 'popup.html' } 
    ]
  })
]
};