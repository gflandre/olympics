#!/bin/sh
npm install
node sochi.js
git commit -a -m"sochi data update"
git push origin master
git checkout -b gh-pages
mkdir tmp
mv ./* tmp/
cp -r tmp/html/* .
rm -Rf tmp
git add .
git commit -a -m"sochi data update"
git pull --no-edit origin gh-pages
git push origin gh-pages
git checkout master
git branch -D gh-pages
