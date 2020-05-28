all: test build
package-all: test package-chrome package-firefox
publish-all: test publish-chrome publish-firefox

clean:
	rm -rf dist *.zip

test:
	npm test

build: clean
	npx gulp

package-chrome: build
	cd dist && npx web-ext build
	mv dist/web-ext-artifacts/aws_agent*.zip chrome.zip

package-firefox: build _prepare-firefox
	cd dist && npx web-ext build
	mv dist/web-ext-artifacts/aws_agent*.zip firefox.zip

publish-chrome: build
	npx shipit chrome dist

publish-firefox: build _prepare-firefox
	npx shipit firefox dist

_prepare-firefox:
	npx json -I -f dist/manifest.json \
	-e 'this.applications = { gecko: { id: "aws-agent@exthilion.org" } };' \
	-e 'this.options_ui.browser_style = true;' \
	-e 'this.icons = { "16": "ico.svg", "48": "ico.svg", "128": "ico.svg" };' \
	-e 'this.browser_action.default_icon = this.icons;'

version:
	npx json -I -f lib/manifest.json -e 'this.version="'$(shell npx json -f package.json version)'"'
	git add lib/manifest.json
