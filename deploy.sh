#!/bin/sh
cd /Users/guillaume/Dev/olympics
/usr/local/bin/npm install
/usr/local/bin/node /Users/guillaume/Dev/olympics/sochi.js
git commit -a -m"sochi data update"
git push origin master
git checkout -b gh-pages
mkdir tmp
mv ./* tmp/
cp -r tmp/html/* .
rm -Rf tmp
git add .
git commit -a -m"sochi data update"
git push origin :gh-pages
git push origin gh-pages
git checkout master
git branch -D gh-pages
