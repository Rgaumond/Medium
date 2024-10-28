/*
 * Copyright (c) 2018, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * A simple web server that initializes the OIDC Middleware library with the
 * given options, and attaches route handlers for the example profile page
 * and logout functionality.
 */

const express = require("express");
const session = require("express-session");
const mustacheExpress = require("mustache-express");
const path = require("path");
const { ExpressOIDC } = require("@okta/oidc-middleware");

const templateDir = path.join(__dirname, "..", "common", "views");
const certDir = path.join(__dirname, "..", "common", "cert");
const frontendDir = path.join(__dirname, "..", "common", "assets");
const fs = require("fs");
const https = require("https");
//const webhostname = "rgoka.com";

module.exports = function SampleWebServer(
  sampleConfig,
  extraOidcOptions,
  homePageTemplateName
) {
  const https_options = {
    key: fs.readFileSync(certDir + "/rgoka.key"),
    cert: fs.readFileSync(certDir + "/STAR_rgoka_com.crt"),
    ca: fs.readFileSync(certDir + "/STAR_rgoka_com.ca-bundle"),
  };

  const oidc = new ExpressOIDC(
    Object.assign(
      {
        issuer: sampleConfig.oidc.issuer,
        client_id: sampleConfig.oidc.clientId,
        client_secret: sampleConfig.oidc.clientSecret,
        appBaseUrl: sampleConfig.oidc.appBaseUrl,
        scope: sampleConfig.oidc.scope,
        testing: sampleConfig.oidc.testing,
      },
      extraOidcOptions || {}
    )
  );

  const app = express();

  app.use(
    session({
      secret: "this-should-be-very-random",
      resave: true,
      saveUninitialized: false,
    })
  );

  // Provide the configuration to the view layer because we show it on the homepage
  const displayConfig = Object.assign({}, sampleConfig.oidc, {
    clientSecret:
      "****" +
      sampleConfig.oidc.clientSecret.substr(
        sampleConfig.oidc.clientSecret.length - 4,
        4
      ),
  });

  app.locals.oidcConfig = displayConfig;

  // This server uses mustache templates located in views/ and css assets in assets/
  app.use("/assets", express.static(frontendDir));
  app.engine("mustache", mustacheExpress());
  app.set("view engine", "mustache");
  app.set("views", templateDir);

  app.use(oidc.router);

  app.get("/", (req, res) => {
    const template = homePageTemplateName || "home";
    const userinfo = req.userContext && req.userContext.userinfo;
    res.render(template, {
      isLoggedIn: !!userinfo,
      userinfo: userinfo,
      testinfo: JSON.stringify(userinfo),
    });
  });

  app.get("/profile", oidc.ensureAuthenticated(), (req, res) => {
    // Convert the userinfo object into an attribute array, for rendering with mustache
    const userinfo = req.userContext && req.userContext.userinfo;
    const attributes = Object.entries(userinfo);
    res.render("profile", {
      isLoggedIn: !!userinfo,
      userinfo: userinfo,
      attributes,
    });
  });

  oidc.on("ready", () => {
    // eslint-disable-next-line no-console

    const httpsServer = https.createServer(https_options, app);

    httpsServer.listen(sampleConfig.port, () =>
      console.log(`Server started on port ${sampleConfig.port}`)
    );

    // app.listen(sampleConfig.port, () => console.log(`App started on port ${sampleConfig.port}`));
  });

  oidc.on("error", (err) => {
    // An error occurred with OIDC
    // eslint-disable-next-line no-console
    console.error("OIDC ERROR: ", err);

    // Throwing an error will terminate the server process
    // throw err;
  });
};
