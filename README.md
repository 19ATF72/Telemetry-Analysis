# Telemetry-Analysis

This project is a  Firefox reporting extension that provides users 
with classification information about 1st & 3rd party
online trackers & cookies embedded by ad-networks and publishers in most pages.
It including classification via Pi-Hole blocklists & Easy-List as categorization lists, as well as domain
mapping & cookie classification utilizing existing resources such as OpenCookieDatabase & Libert (2015) domain-organisation mapping.

It adds a browser action to analyse scripts &amp; telemetry on the page, and is tested with the latest version of firefox.

## Installation guide
Installation has been tested on Firefox 85.0 and above, or alternatively use the Firefox Developer or Nightly edition.
### 1. Download the project, either via git clone or directly as a Zip.
### 2. Unzip / locate the project once downloaded.
### 3. Open Firefox
#### 3.1 In a new tab navigate to the about:config page
- Search for 'xpinstall.signatures.required' & set it to false.
- Search for 'extensions.langpacks.signatures.required' & set it to false.
#### 3.2 Navigate to the Add-ons / extensions page
- Either go to options menu (Tab with 3 vertical lines) -> Add-ons & Themes
- Or press Ctrl+Shift+A as a shortcut
#### 3.3 On the manage extensions page, click the cog
#### 3.4 Click install 'Add-on from file'
#### 3.5 Go to the location of the project -> Then go to 'web-ext artifacts' -> Select the latest build (2.3 currently)
#### 3.6 Approve extension permissions
### 4. Wait 10 seconds & restart Firefox

The extension is now ready for use, the page action feature is now available on any page.
