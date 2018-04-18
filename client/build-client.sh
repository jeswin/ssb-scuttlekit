echo Compiling client...
rm -rf dist
cp -r src dist
webpack --config webpack.prod.js
echo Done.