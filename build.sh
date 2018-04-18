(cd client && ./build-client.sh) && (cd server && ./build-server.sh)
echo Copy client bundle to server/dist/client...
cp -r client/dist/* server/dist/client
echo Done.