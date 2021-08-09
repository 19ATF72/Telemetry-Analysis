# [Telemetry-Analysis](https://addons.mozilla.org/en-US/firefox/addon/telemetry-analysis/)
Have you ever wondered how many companies are involved whenever you load a webpage?  
Do you ever considered what other websites you visit they are involved with?  
Can you know how they intend to use this information?  
Advertising? Telemetry? Tracking?  

This extension makes understanidng the relationships betweeb you and them as simple as a picture.  
(That hopefully speaks a thousand words).

[We are now on the Mozilla Extension Store!](https://addons.mozilla.org/en-US/firefox/addon/telemetry-analysis/)  

## Features

Sitemap with links to all the entities involved when loading a page.

![simple-benign](https://user-images.githubusercontent.com/54142191/128661549-1bcd6b0e-fd11-4450-910c-4411632d345d.png)  
From simple and benign

![nebulous-map](https://user-images.githubusercontent.com/54142191/128661553-86aa1d3c-f2e8-453b-99ee-3ccc6b0ecf29.png)  
To nebulous and interesting

![forming-constelations](https://user-images.githubusercontent.com/54142191/128661697-0e407efc-ca99-465d-94fd-ab0498dc1cc5.png)  
There is often more than meets the eye

![Constelations-growing](https://user-images.githubusercontent.com/54142191/128662900-7bac4cb3-8978-4860-8ad6-16c846433a2d.png)  
With constelations forming over time

![detailed-breakdown](https://user-images.githubusercontent.com/54142191/128662570-91628b4b-fbc7-4e62-96d5-56a473f776d6.png)  
And detailed relationship and purpose breakdown  

It also includes a more detailed breakdown of the individual elements and their classifications & understood purpose.  

![app-main-screen-cropped](https://user-images.githubusercontent.com/54142191/128663263-54cafa0e-b53c-4f43-8c8d-1fcd7b2acf12.png)  
Including cookie & request counts

![hover-cookie-cropped](https://user-images.githubusercontent.com/54142191/128663285-b8653508-7037-4594-971b-d3fe6acf499a.png)  
Cookie classification for 1st and 3rd party cookies and individual cookie breakdown

![hover-web-request-cropped](https://user-images.githubusercontent.com/54142191/128663292-4a84f588-4f9f-489b-aa2f-815bbd316403.png)  
Web Request classification and domain mapping with ownership information

![all-1-button-blurred](https://user-images.githubusercontent.com/54142191/128664051-5bec22d5-cb58-4781-af12-af93d0c7325a.png)
All available in the browser in one click

## Technical Description
This project is a Firefox reporting extension that provides users 
with classification information about 1st & 3rd party
online trackers & cookies embedded by ad-networks and publishers in most pages.
It including classification via Pi-Hole blocklists & Easy-List as categorization lists, as well as domain
mapping & cookie classification utilizing existing resources such as OpenCookieDatabase & Libert (2015) domain-organisation mapping.
It adds a browser action to analyse scripts &amp; telemetry on the page, and is tested with the latest version of firefox.

## Manual installation guide
Installation has been tested on Firefox 85.0 and above, or alternatively use the Firefox Developer or Nightly edition.
### 1. Download the latest signed extension file
- Currently 'telemetry_analysis-2.7-an+fx.xpi' in 'web-ext artifacts'.
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
