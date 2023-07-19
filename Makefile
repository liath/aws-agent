.PHONY: *

package-all: test package-chrome package-firefox

clean:
	rm -rf dist *.zip

test:
	npm test

build-chrome: clean
	npx gulp chrome-prod 
build-firefox: clean
	npx gulp firefox-prod

package-chrome: build-chrome
	cd dist && npx web-ext build
	mv dist/web-ext-artifacts/aws_agent*.zip chrome.zip
package-firefox: build-firefox _prepare-firefox
	cd dist && npx web-ext build
	mv dist/web-ext-artifacts/aws_agent*.zip firefox.zip

_prepare-firefox:
	npx json -I -f dist/manifest.json \
	-e 'this.applications = { gecko: { id: "aws-agent@exthilion.org" } };' \
	-e 'this.options_ui.browser_style = true;' \
	-e 'this.icons = { "16": "ico.svg", "48": "ico.svg", "128": "ico.svg" };' \
	-e 'this.browser_action.default_icon = this.icons;'

version:
	npx json -I -f lib/manifest.json -e 'this.version="'$(shell npx json -f package.json version)'"'
	git add lib/manifest.json

