const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");

// Read environment variables from "testenv". Override environment vars if they are already set. https://www.npmjs.com/package/dotenv
const TESTENV = path.resolve(__dirname, "testenv");
if (fs.existsSync(TESTENV)) {
  const envConfig = dotenv.parse(fs.readFileSync(TESTENV));
  Object.keys(envConfig).forEach((k) => {
    process.env[k] = envConfig[k];
  });
}

var ISSUER = process.env.ISSUER || "https://rg-esolv.okta.com/oauth2/default";
var CLIENT_ID = process.env.CLIENT_ID || "0oacrmtg16DDSv1Vg697";
var CLIENT_SECRET =
  process.env.CLIENT_SECRET ||
  "MdIh-7evmNkHrOyrPRRZ7HH-P3valJ5sO-RV1FGUemq5pTkwRCHohetYqgJTRsbB";
var SPA_CLIENT_ID = process.env.SPA_CLIENT_ID || "0oacrmtg16DDSv1Vg697";
var OKTA_TESTING_DISABLEHTTPSCHECK = process.env.OKTA_TESTING_DISABLEHTTPSCHECK
  ? true
  : false;

module.exports = {
  webServer: {
    port: 3442,
    oidc: {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      issuer: ISSUER,
      appBaseUrl: "https://wic_oidc_medium.esolv.ca",
      scope: "openid profile email",
      testing: {
        disableHttpsCheck: OKTA_TESTING_DISABLEHTTPSCHECK,
      },
    },
  },
  resourceServer: {
    port: 8000,
    oidc: {
      clientId: SPA_CLIENT_ID,
      issuer: ISSUER,
      testing: {
        disableHttpsCheck: OKTA_TESTING_DISABLEHTTPSCHECK,
      },
    },
    assertClaims: {
      aud: "api://default",
      cid: SPA_CLIENT_ID,
    },
  },
};
