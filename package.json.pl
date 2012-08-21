#!/usr/local/bin/perl -w

use strict;
use warnings;
use FindBin qw($Bin);
 
my $PRODUCT_NAME='arrow';

my $cmd = "/bin/sh $Bin/../package/${PRODUCT_NAME}.README.sh | awk '/^[vV]ersion [0-9.]+/ {print \$2; exit}'";
my $version = `$cmd`;
unlink("package.json");
chomp $version;
#$version =~ s/(.+)\.(.+)/$1-$2/;

print <<EOF;
{
  "author": "Lego-QEP <lego-qe-platform\@yahoo-inc.com> (http://twiki.corp.yahoo.com/view/Lego/TeamQEPlatform)",
  "name": "arrow",
  "description": "FrontEnd Testing Framework",
  "version": "${version}",
  "homepage": "http://twiki.corp.yahoo.com/view/Lego/Arrow",
     "repository": {
         "type": "svn",
         "url": "svn+ssh://svn.corp.yahoo.com/yahoo/media/common/tools/trunk/arrow/"
     },
     "man": "../man/arrow.1",
     "main": "./index.js",
     "scripts": {
         "help": "arrow --help",
         "test": "ytestrunner --yui3 --include **/*-tests.js --cov-exclude=**/webdriver.js  --cov-exclude=**/node_modules/* -v -c --save-coverage --save-results"
     },
     "yahoo": {
         "bugzilla": {
             "product": "Lego QE Platform",
             "component": "Arrow"
         }
     },
     "bin": {
         "arrow": "./index.js",
         "arrow_server" : "arrow_server/server.js",
         "arrow_selenium" : "arrow_selenium/selenium.js"
     },
     "engines": [ "node >=0.6" ],
     "dependencies": {
         "glob": "*",
         "nopt": "*",
         "colors":"*",
         "express":"*",
         "yui": "*",
         "JSV": "*",
         "log4js": "*",
         "clone": "*",
         "useragent": "*"
     },
     "devDependencies": {
             "ytestrunner": "*",
             "mockery": "*"
 	 }
}
EOF

