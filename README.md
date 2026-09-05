<div align="center">

# 🪞 ReflectAI

**Authenticated Reflection & Journaling Assistant — Full-Stack AI Workspace**

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Backend-Express_%2B_Node.js-000000?logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Auth-Firebase_Google_Sign--In-FFCA28?logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Database-Cloud_Firestore-FF6F00?logo=firebase&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Gemini_3.6_Flash-4285F4?logo=google&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

[Architecture](#architecture-overview) · [Prerequisites](#1-prerequisites--gcp-configuration) · [Secrets](#2-secret-management-setup) · [Firestore Rules](#3-database-security-configuration-cloud-firestore) · [Local Dev](#4-local-development) · [Deploy](#5-production-build--cloud-run-deployment) · [Tests](#6-end-to-end-functional-test-walkthrough)

</div>

---

ReflectAI is a full-stack, user-authenticated journaling, emotional intelligence, and multi-turn reflection workspace built with **React**, **Express**, **Firebase Authentication (Google Sign-In)**, **Cloud Firestore**, and **Google Gemini 3.6 Flash**.

All journal entries and conversational reflections are strictly isolated to each authenticated user using owner-bound Cloud Firestore security rules. Server-side AI processing eliminates client-side API key leakage and provides resilient fallback handling.

---

## Architecture Overview

| Layer | Technology | Security & Isolation Architecture |
| :--- | :--- | :--- |
| **Authentication** | Firebase Auth | Federated Google Sign-In; no raw passwords stored. |
| **Database** | Cloud Firestore | Owner-bound isolation at `/users/{userId}/journalEntries/{id}` and `/users/{userId}/interactions/{id}`. |
| **Backend Service** | Express + Node.js | Serves client SPA and proxies Gemini requests; zero client secret exposure. |
| **AI Intelligence** | Gemini 3.6 Flash API | Multi-turn reflections & AI Mood/Productivity Hub with automated fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |
| **Export & Portability** | Custom Export Engine | Client-side export to Markdown (`.md`), JSON backup archive (`.json`), and formatted PDF/Print. |
| **Secret Management** | Google Secret Manager | Secure retrieval of `GEMINI_API_KEY` without source code hardcoding. |

---

## 1. Prerequisites & GCP Configuration

### 1.1 Enable Required Google Cloud APIs
Run the following commands using the Google Cloud SDK (`gcloud`):

```bash
# Set your active GCP project ID
export PROJECT_ID="YOUR_PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable Cloud Run, Secret Manager, and Firestore APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  iam.googleapis.com
```

---

## 2. Secret Management Setup

Do **not** commit API keys to version control. Store your `GEMINI_API_KEY` securely in Google Cloud Secret Manager.

```bash
# 1. Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your secret version
echo -n "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Retrieve your project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# 4. Grant the default Cloud Run Compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

ReflectAI enforces strict owner-bound data isolation. Deploy the following security rules to ensure users can only read and write their own documents:

### `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Isolated user journal entries
    match /users/{userId}/journalEntries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Isolated user journal interactions and reflections
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the security rules to Firebase:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development

Install dependencies and start the unified full-stack server:

```bash
# Install dependencies
npm install

# Start Express + Vite development server (port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 5. Production Build & Cloud Run Deployment

### 5.1 Build the Application
```bash
npm run build
```

### 5.2 Deploy to Cloud Run
Deploy the application to Cloud Run, attaching the Secret Manager secret:

```bash
export REGION="asia-southeast1" # or your preferred region, e.g. us-central1
export SERVICE_NAME="reflect-ai-journal"

gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### 5.3 Mandatory Campaign Verification Labeling
Apply the required campaign label to register the service for automated challenge verification:

```bash
gcloud run services update $SERVICE_NAME \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 6. End-to-End Functional Test Walkthrough

Below are the structured test cases covering every user interaction:

| Test Case | Interaction / Trigger | Expected Outcome |
| :--- | :--- | :--- |
| **TC-01: Landing & Auth Prompt** | Navigate to `/` as an unauthenticated user | Landing page renders with "Sign In with Google" CTA, feature overview, and no access to private vault. |
| **TC-02: Federated Google Login** | Click "Sign In with Google" | Google authentication popup opens; on approval, user is authenticated and redirected to private dashboard. |
| **TC-03: Private Vault Isolation** | Authenticated user enters dashboard | Firestore listener attaches to `/users/{userId}/journalEntries`. Entries from other users are completely inaccessible. |
| **TC-04: New Reflection Creation** | Click "+ New Reflection" | A new reflection document is created with a unique ID and saved to Firestore. Status shows "Isolated". |
| **TC-05: Multi-Turn Conversation** | Type reflection text and press `Cmd+Enter` or click Send | User message is optimistically appended, saved to Firestore, and dispatched to `/api/gemini/reflect`. |
| **TC-06: Gemini Response & Model Tag** | Gemini returns content | Model reply renders with model badge (e.g. `gemini-3.6-flash`) and timestamp; full interaction saved to Firestore. |
| **TC-07: Mode Switching (Brainstorm/Summary)** | Select "Brainstorm" or "Summary" mode | Subsequent prompts adapt Gemini's persona and system instructions to provide tailored ideation or structured synthesis. |
| **TC-08: Historical History & Search** | Type keyword into sidebar search box | Reflections filter in real time by title and content snippets. |
| **TC-09: Title Editing** | Click reflection title heading, edit name, press Enter | Title updates in state and persists to Firestore document immediately. |
| **TC-10: Reflection Deletion** | Click trash icon on reflection card and confirm | Document is deleted from Firestore; list updates reactively. |
| **TC-11: Network / Error Resilience** | Simulate API dropout or transient failure | Error banner appears with "Retry Generation"; user input buffer is preserved to prevent data loss. |
| **TC-12: AI Mood & Productivity Intelligence Hub** | Click "AI Mood Hub" in top navigation | Hub opens; clicking "Generate Full AI Analysis" synthesizes entries into sentiment scores, cognitive patterns, and dynamic Recharts visuals. |
| **TC-13: Advanced Export Hub (Markdown/JSON/PDF)** | Click Download icon in top navbar | Export modal opens; user can download `.md` file, download `.json` backup archive, or open clean printable PDF layout. |
| **TC-14: 1-Click Clipboard Copy** | Click "Copy Markdown" in Export Modal or copy icon on message | Formatted text is copied to clipboard and live success toast banner appears. |
| **TC-15: Dark / Light Mode Toggle** | Click Sun/Moon icon in top navbar | App seamlessly toggles between dark luxury theme and crisp light theme; preference persists in `localStorage`. |
| **TC-16: Collapsible Desktop Sidebar** | Click panel collapse button on desktop sidebar | Sidebar shrinks into a compact icon rail, maximizing workspace focus area; clicking again restores full width. |
| **TC-17: Sign Out** | Click Sign Out icon in top navbar | Auth session terminates; UI reverts safely to Landing Page with cleared memory. |

---

## 👨‍💻 Author & Acknowledgments

- **Developer**: **Muhammad Ali Shan** (Computer Science Student, UET Lahore)
- **Context**: Developed strictly through official **Google GenAI Codelabs** and cloud infrastructure training modules.

---

<div align="center">

Built with ❤️ for the **Google Cloud Run Ideathon Challenge**
<br/>
AI Excellence | Official Google GenAI Codelabs

</div>
