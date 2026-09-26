# Folio

A quiet Gmail reader for newsletters. It does three things:

1. **Inbox**: everything in your Gmail inbox, newest first. Read/unread isn't tracked.
2. **Reader**: tap a message to open it full screen with no toolbars. Long emails are
   never clipped. Gmail cuts messages off at ~102 KB, but Folio fetches the whole
   body from the Gmail API and reflows it into a clean reading column (Mozilla
   Readability, the engine behind Firefox Reader View). Emails that don't suit reader
   mode, such as link round-ups or heavily designed promos, show their original
   layout scaled to fit your screen. A link at the bottom switches between the two views.
3. **Archive**: scroll to the end, tap the archive button, and you're back in the
   inbox. An *Undo* toast appears briefly in case you tapped it by mistake.

Links open in your browser. Light and dark mode follow the system setting.

Built with Expo (React Native), Expo Router, `react-native-webview` and native
Google Sign-In. There's no server: the app talks to the Gmail API directly from
your phone.

---

## Install on your Android phone

You need to do two one-time setup steps: (A) a Google Cloud project so the app is
allowed to read your Gmail, and (B) a GitHub build that produces the APK.

### A. Google Cloud setup (≈10 minutes, one time)

1. Go to <https://console.cloud.google.com/> and **create a project** (e.g. "Folio").
2. **Enable the Gmail API**: *APIs & Services → Library*, search "Gmail API",
   then click **Enable**.
3. **Configure the consent screen**: *Google Auth Platform* (formerly *OAuth consent
   screen*) → **Get started**.
   - App name `Folio`, with your email as the support and contact email.
   - Audience: **External**.
4. **Add yourself as a user**: *Audience → Test users → Add users*, then enter your
   Gmail address.
5. **Create the Android client**: *Clients → Create client*.
   - Application type: **Android**
   - Package name: `com.bpiggin.folio`
   - SHA-1 certificate fingerprint:
     ```
     5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
     ```
     This is the fingerprint of the key the GitHub build signs the APK with (see
     *Using your own signing key* below if you want a private one).

   You don't need a client ID in the code. Google matches the app by its
   package name and signature.

> **Avoiding weekly sign-outs.** While the app's publishing status is *Testing*,
> Google expires your sign-in after 7 days. To stop that, go to *Audience* and
> click **Publish app**. You don't need to submit it for verification for personal
> use. When you connect, Google shows a "Google hasn't verified this app" screen;
> tap **Advanced → Go to Folio (unsafe)** to continue. It's your own app, so
> this is expected.

### B. Build the APK (automatic)

The workflow in `.github/workflows/build-apk.yml` builds the APK on GitHub's
servers, so you don't need Android Studio.

- Every push to `main` builds the APK and publishes it as a **GitHub Release**.
- Pushes to other branches (and manual runs from the *Actions* tab) build it as a
  downloadable workflow artifact.

To install:

1. On your phone, open `https://github.com/bpiggin/folio/releases/latest`.
2. Tap **folio.apk** to download it, then open it. Android will ask you to allow
   installs from your browser the first time.
3. Open Folio and tap **Connect Gmail**.

To update, install a newer `folio.apk` over the old one. Your sign-in is kept.

### Using your own signing key (optional)

By default the APK is signed with React Native's standard debug key, which is the
same key for every React Native project. That's fine for a personal sideloaded app,
since Google still asks *you* to sign in and consent. If you'd rather use a
private key:

```sh
keytool -genkeypair -v -keystore folio.keystore -alias androiddebugkey \
  -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Folio"
base64 -w0 folio.keystore   # macOS: base64 -i folio.keystore
keytool -list -v -keystore folio.keystore -storepass android | grep SHA1
```

1. Add the base64 output as a repository secret named `ANDROID_KEYSTORE_BASE64`
   (*Settings → Secrets and variables → Actions*).
2. Replace the SHA-1 on your Google Cloud Android client with the new one.
3. Uninstall the old APK before installing the new one. Android won't update an
   app across signing keys.

---

## Development

```sh
npm install
npx expo run:android     # needs Android Studio / an Android SDK, or a USB-connected phone
npm run typecheck
npm run lint
```

Google Sign-In is a native module, so the app doesn't run in Expo Go. Use
`expo run:android`, which builds a development build. For local debug builds,
register the SHA-1 of `android/app/debug.keystore` in Google Cloud. It's the same
standard key as above unless you've changed it.

### Project layout

```
src/app/_layout.tsx          fonts, theme, navigation stack
src/app/index.tsx            inbox (or the connect screen when signed out)
src/app/message/[id].tsx     full-screen reader
src/components/SignIn.tsx    connect screen
src/lib/auth.ts              Google Sign-In + access tokens (scope: gmail.modify)
src/lib/gmail.ts             Gmail REST calls: list inbox, fetch full message, archive
src/lib/store.tsx            inbox state, paging, optimistic archive + undo
src/reader/template.ts       the reader page rendered in the WebView
scripts/gen-readability.js   bundles @mozilla/readability into src/reader/
```

### Permissions

Folio requests `https://www.googleapis.com/auth/gmail.modify`, the narrowest
Gmail scope that allows archiving (removing the `INBOX` label). It can't
permanently delete mail.
