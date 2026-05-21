#!/bin/sh
wget -S -O /tmp/login_result.txt --post-data='{"username":"juanito","password":"1234"}' --header='Content-Type: application/json' http://localhost:8080/api/usuarios/login 2>&1
echo "--- RESPONSE ---"
cat /tmp/login_result.txt
