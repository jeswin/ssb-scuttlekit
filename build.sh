rm -rf dist
cp -r src dist
tsc
tsc -p src/client/