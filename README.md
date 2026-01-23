Masala & Mug — Static Website (Demo)

![Menu Screenshot](assets/images/menu-screenshot.png)

*Preview of the menu page. Click images to enlarge (lightbox feature).*

This is a small, responsive static website template for a tea & coffee shop in India. It includes a hero, menu, about, gallery, and contact sections, with a warm, Indian-inspired color palette.
## Features

- Responsive design for desktop and mobile
- Menu with teas, coffees, snacks, and food
- Add to cart, remove, update quantity, and save for later
- Persistent cart (localStorage)
- Lightbox for menu/gallery images
- Toast notifications for user actions
- Checkout modal with stepper, print, and export options
- Easy deployment to Apache Tomcat and CI/CD with Jenkins

---
## Quick Start (Advanced)

1. **Clone the repository**
	```powershell
	git clone <your-repo-url>
	cd 'c:\Users\Rajendra\OneDrive - Alliance\Desktop\static_website'
	```
2. **Preview locally**
	```powershell
	python -m http.server 8000
	# or
	npx http-server -p 8000
	```
3. **Open in browser**
	- Go to [http://localhost:8000](http://localhost:8000)
	- Try the menu, cart, and lightbox features
4. **Customize**
	- Replace images in `assets/images` with your own
	- Edit `index.html` and `assets/styles.css` for branding
	- Update prices, menu items, and business info
5. **Deploy**
	- See Tomcat and Jenkins CI/CD instructions below

---
## Customization & Extending

- **Add new menu items:** Edit `index.html` and update the menu section.
- **Change styles:** Modify `assets/styles.css` for colors, fonts, and layout.
- **Integrate backend:** Connect the contact form or cart to your backend or third-party service.
- **SEO:** Add structured data and meta tags for better search visibility.
- **Internationalization:** Localize text, prices, and menu for your region.

## Contributing

Pull requests and suggestions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---
License: use and modify freely for your shop demo.

---

Files created
- `index.html` — homepage and layout
- `assets/styles.css` — styles and responsive rules
- `assets/script.js` — small UX scripts (mobile nav, form feedback, year)

How to preview (PowerShell)

Open PowerShell, cd to the project folder, then run a simple HTTP server:

```powershell
cd 'c:\Users\Rajendra\OneDrive - Alliance\Desktop\static_website'
python -m http.server 8000
# or, if you have Node.js installed:
# npx http-server -p 8000
```

Then open http://localhost:8000 in your browser.

Notes & next steps
- Replace placeholder images (currently hot-linked from Unsplash) with your own photos in `assets/images` and update `index.html`.
- Connect the contact form to a backend or a service (e.g., Formspree) for real orders.
- Localize prices, menu items, and opening hours as needed.
- Consider adding structured data (JSON-LD) for local business and menu for better SEO.

License: use and modify freely for your shop demo.

## Deploying to Apache Tomcat

To deploy this static site as a WAR on Tomcat follow these steps.

1. Ensure Tomcat is installed and running locally (default port 8080).
2. Make sure you have a user with the role `manager-script` in `tomcat-users.xml` so the script can deploy. Example snippet to add inside `<tomcat-users>`:

```xml
<role rolename="manager-script"/>
<user username="admin" password="yourpassword" roles="manager-script"/>
```

3. From PowerShell, run the provided packaging script to build the WAR (and deploy if you choose):

```powershell
cd 'c:\Users\Rajendra\OneDrive - Alliance\Desktop\static_website'
# build only
.\build_and_deploy.ps1
# build and deploy (you will be prompted to pass correct credentials)
.\build_and_deploy.ps1 -deploy -tomcatUser admin -tomcatPass yourpassword
```

4. Alternatively, copy `masalaandmug.war` into Tomcat's `webapps` folder and Tomcat will auto-deploy it.

Notes

## CI/CD with Jenkins Pipeline (Automated Tomcat Deployment)

To automate build and deployment to Tomcat using Jenkins, follow these steps:

### 1. Jenkins Setup

- Install Jenkins and required plugins: Pipeline, Git, and Deploy to Container.
- Configure Jenkins credentials for Tomcat Manager (`manager-script` role).
- Create a new Pipeline job and connect it to your repository.

### 2. Example Jenkinsfile

Add a `Jenkinsfile` to your project root:

```groovy
pipeline {
	agent any
	environment {
		WAR_NAME = 'masalaandmug.war'
		TOMCAT_URL = 'http://localhost:8080/manager/text'
		TOMCAT_USER = credentials('tomcat-user') // Jenkins credentials ID
		TOMCAT_PASS = credentials('tomcat-pass') // Jenkins credentials ID
	}
	stages {
		stage('Build WAR') {
			steps {
				sh 'jar -cvf $WAR_NAME -C . .'
			}
		}
		stage('Deploy to Tomcat') {
			steps {
				// Uses curl to deploy WAR via Tomcat Manager
				sh '''
				curl --upload-file $WAR_NAME "$TOMCAT_URL/deploy?path=/masalaandmug&update=true" \
				  --user "$TOMCAT_USER:$TOMCAT_PASS"
				'''
			}
		}
	}
}
```

### 3. Jenkins Credentials

- In Jenkins, add credentials for Tomcat Manager user and password (ID: `tomcat-user`, `tomcat-pass`).

### 4. Notes

- Ensure Tomcat is running and accessible from Jenkins.
- The pipeline builds the WAR and deploys it to Tomcat automatically on every commit.
- For production, use HTTPS and restrict Jenkins/Tomcat access.

---

## Printable menu & images

- A printable menu page is available at `menu-print.html`. Open it and use the browser Print -> Save as PDF to create a PDF menu.
- There's also a downloadable `prices.csv` in the project root for easy import into spreadsheets or POS systems.
- Images in the site (menu and gallery) support a lightbox: click any menu or gallery image to enlarge it.

Try it:

```powershell
# open project then preview in browser
cd 'c:\Users\Rajendra\OneDrive - Alliance\Desktop\static_website'
python -m http.server 8000
# then open http://localhost:8000 and click the "Printable Menu" button or any image to enlarge.
```
jar -cvf IndiaTeaCoffeeShop.war -C IndiaTeaCoffeeShop/ .
