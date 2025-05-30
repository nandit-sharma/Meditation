#!/bin/bash
cp ../index.html .
cp ../script.js .
cp ../styles.css .
if [ ! -f data.json ]; then
  echo "{}" > data.json
fi 