echo Compiling server...
rm -rf dist
cp -r src dist
tsc
echo Done.