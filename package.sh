#!/usr/bin/env bash

# cleanup old artifacts
rm -Rf dist

# build
gulp
cd dist

printf "\nPackaging for Chrome\n"
web-ext build
mv web-ext-artifacts/aws_agent*.zip chrome.zip

printf "\nPackaging for Firefox\n"
json -I -f manifest.json -e '
this.applications = { gecko: { id: "aws-agent@exthilion.org" } };
this.options_ui.browser_style = true;
var icons = {
  "16": "ico.svg",
  "48": "ico.svg",
  "128": "ico.svg"
};
this.icons = icons;
this.browser_action.default_icon = icons;'
web-ext build
mv web-ext-artifacts/aws_agent*.zip firefox.zip
