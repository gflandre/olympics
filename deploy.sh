#!/bin/sh
./sochi.js
git commit -a -m"sochi data update"
git push origin master
git checkout gh-pages
git merge master
git push origin gh-pages
git checkout master
