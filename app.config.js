// Forks set their own Android package name (it must be unique per Google Cloud
// OAuth client) via the FOLIO_ANDROID_PACKAGE env var / ANDROID_PACKAGE repo variable.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    package: process.env.FOLIO_ANDROID_PACKAGE || config.android.package,
  },
});
