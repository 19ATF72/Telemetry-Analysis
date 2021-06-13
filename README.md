# Telemetry-Analysis

This project is a  Firefox reporting extension that provides users 
with classification information about 1st & 3rd party
online trackers & cookies embedded by ad-networks and publishers in most pages.
It including classification via Pi-Hole blocklists & Easy-List as categorization lists, as well as domain
mapping & cookie classification utilizing existing resources such as OpenCookieDatabase & Libert (2015) domain-organisation mapping.

It adds a browser action to analyse scripts &amp; telemetry on the page, and is tested with the latest version of firefox.

## Install from the AMO
Coming soon!

## Manual installation guide
Installation has been tested on Firefox 85.0 and above, or alternatively use the Firefox Developer or Nightly edition.
### 1. Download the latest signed extension file, currently 'telemetry_analysis-2.7-an+fx.xpi' in 'web-ext artifacts'.
### 2. Open Firefox
#### 2.1 Navigate to the Add-ons / extensions page
- Either go to options menu (Tab with 3 vertical lines) -> Add-ons & Themes
- Or press Ctrl+Shift+A as a shortcut
#### 2.2 On the manage extensions page, click the cog
#### 2.3 Click install 'Add-on from file'
#### 2.4 Select the downloaded extension file
#### 2.5 Approve extension permissions
### 3. Wait 10 seconds

The extension is now ready for use, the page action feature is now available on any page.

## Screenshots
![app-main-screen](https://user-images.githubusercontent.com/54142191/121823223-c3171880-cc9b-11eb-9ac1-071235b0e8df.png)
Main screen of the application on a site.

![hover-cookie](https://user-images.githubusercontent.com/54142191/121823227-cc07ea00-cc9b-11eb-840f-5a21df236c26.png)
Cookie classification display for 3rd party cookies.

![hover-web-request](https://user-images.githubusercontent.com/54142191/121823229-d32ef800-cc9b-11eb-8437-61b1047316cc.png)
Web Request classification display for the site.
