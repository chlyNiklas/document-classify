# ClassifyUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Authentication

The UI supports OIDC Authorization Code flow with PKCE. It loads its identity-provider settings at
runtime from `src/assets/auth-config.json`, allowing the same compiled image to be configured per
environment. Authentication is disabled in the checked-in configuration so local development works
without an identity provider.

For a deployment, copy `auth-config.example.json`, replace its placeholder values, and serve or
mount it at `/usr/share/nginx/html/assets/auth-config.json` in the UI container. The identity
provider's public browser client must allow the UI's exact origin as its redirect and post-logout
redirect URI. Do not configure a client secret in the browser client.

Example Docker mount:

```yaml
services:
  classify-ui:
    volumes:
      - ./auth-config.json:/usr/share/nginx/html/assets/auth-config.json:ro
```

When authentication is enabled, application bootstrap waits for the OIDC callback to be processed.
An unauthenticated visitor is redirected to the identity provider before protected routes render.
The access token is attached only to requests under the configured API's `/v1/` path. The API must
be configured for the audience and required scope that the identity provider puts into the UI's
access token.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
