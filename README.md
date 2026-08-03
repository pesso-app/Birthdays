# 🎂 Birthdays - Never forget a special date

**Birthdays** is an iOS native-style Progressive Web App (PWA) designed to manage, remember, and view the birthdays of your friends, family, and coworkers in a completely private, fast, and modern way.

The app works locally on the device (without external servers) using cutting-edge browser technologies.

---

## 🌟 Key Features

### 📱 Native-Grade User Experience (UX)
* **iOS Style Design:** Glassmorphism blur effects, modern typography (Inter), smooth transitions, and full support for automatic or manual **Dark Mode**.
* **Haptic Feedback:** Subtle vibrations (`vibrate` API) when pressing buttons, deleting, or saving data for a premium tactile feel on mobile devices.
* **Splash Screen:** Clean entry animation when launching the application from the home screen.
* **Swipe to Delete:** Intuitive mobile gesture on list items revealing a quick delete button with smart auto-closing of other open cards.

### 📅 Date & Information Management
* **Dynamic Highlights:** Featured **TODAY** section with animated confetti burst to celebrate current birthday people.
* **Categories & Filters:** Fast organization by categories (Family, Friends, Work, Others) and upcoming birthdays section for the next 30 days.
* **Timeline View:** Chronological view grouped by months detailing the day, day of the week, remaining days, turning age, and zodiac sign with its emoji symbol.
* **Advanced Statistics:** Analysis of total contacts, current average age, birthdays in the current month, and exact countdown to the closest birthday.

### 🚀 Integrations & Exporting
* **Share via WhatsApp:** Generates and automatically opens a custom message with appropriate emojis to wish a happy birthday ("Today is...", "Tomorrow...", etc.) or remind about the date.
* **Add to Calendar (ICS):** Generates and downloads a standard calendar file compatible with Apple Calendar, Google Calendar, and Microsoft Outlook, featuring automatic yearly recurrence and a reminder alarm set for 1 day before.
* **Export to PDF:** Generates a clean, paginated PDF document with the full list of all birthdays, date details, and zodiac signs.
* **Data Backup:** Export all data and settings to a JSON file and restore them anytime on any device.

### 🔒 Privacy & PWA (Offline Mode)
* **Local IndexedDB:** Direct storage in the device's browser. Data is 100% private and never travels to any web server.
* **Offline Functionality:** Service Worker v4 registration that caches HTML structure, stylesheets, and required CDN libraries (including Tailwind CSS v4 and Google Fonts), allowing complete offline access.

---

## 📁 Project Structure

* **[index.html](file:///c:/Users/Adriel/Desktop/2027/Codes/Projects/Birthday/birthday-v2.0/index.html):** DOM structure, modal layout, dynamic statistics views, and Timeline.
* **[app.js](file:///c:/Users/Adriel/Desktop/2027/Codes/Projects/Birthday/birthday-v2.0/app.js):** Interface controllers (UIController), touch gesture management (SwipeToDelete), date utilities, zodiac, ICS and PDF export, and IndexedDB core logic.
* **[style.css](file:///c:/Users/Adriel/Desktop/2027/Codes/Projects/Birthday/birthday-v2.0/style.css):** Stylesheet with CSS variables adapted for light/dark modes, confetti animations, glassmorphism effects, and responsiveness for mobile safe areas (iOS Safe Areas).
* **[sw.js](file:///c:/Users/Adriel/Desktop/2027/Codes/Projects/Birthday/birthday-v2.0/sw.js):** Service worker managing local caching strategy, external CDN resources, and local notifications.
* **[manifest.json](file:///c:/Users/Adriel/Desktop/2027/Codes/Projects/Birthday/birthday-v2.0/manifest.json):** Progressive Web App configuration enabling installation on mobile devices as a full-screen app.

---

## ⏳ Version History

### `v2.1.0` (Current Version)
* **English Translation:** Full internationalization of the app UI, settings, notifications, export tools (PDF, ICS, WhatsApp), and documentation into English.
* **Time Zone Correction:** Implementation of `utils.parseLocalDate` fixing timezone offset bugs. Previously, saving a birthday interpreted dates in UTC ISO format, causing them to show the previous day's evening in American timezones (such as GMT-4/5).
* **January Zodiac Fix:** Resolved logical overlap in `utils.getZodiac` month range iterations. Previously, dates between January 20th and 31st were incorrectly categorized as Capricorn instead of Aquarius.
* **Full Offline Cache:** Updated `sw.js` to cache version `v4` and fixed the fetch interceptor to allow caching `'cors'` and `'opaque'` response types. This allows Tailwind CSS v4 (`cdn.jsdelivr.net`) and Google Fonts (`fonts.gstatic.com`) to be stored locally and work without internet.
* **Visual Fixes:**
  * Fixed stat pluralization for birthdays 1 day away ("1 day" instead of "1 days").
  * Optimized list card Swipe gesture so sliding a new card automatically closes any previously opened card.

### `v2.0.0`
* Added advanced statistics and interactive modals.
* Implemented monthly chronological view (Timeline).
* Integration with WhatsApp API and dynamic ICS file export for mobile calendars.
* Export birthday lists to native PDF documents using `jsPDF`.

### `v1.0.0`
* Initial application launch.
* Local database on IndexedDB.
* Contact registration and editing (Name, Birthdate, Category, and Notes).
* Quick list filtering by categories (Family, Friends, Work).

---

## 🛠️ Installation & Local Usage

To run the application locally:
1. Clone or copy project files to a local directory.
2. Start a static web server in the root directory. For example:
   ```bash
   # Using Node.js http-server
   npx http-server -p 8080
   
   # Or using Python
   python -m http.server 8080
   ```
3. Open your browser and navigate to `http://localhost:8080`.
4. To install on mobile devices, select **"Share > Add to Home Screen"** (on iOS/Safari) or tap **"Install app"** (on Android/Chrome).
