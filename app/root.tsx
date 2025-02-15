import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  LinksFunction,
  Outlet,
} from "react-router";
import { AuthProvider } from "~/context/auth.provider";
import { ConnectedProvider } from "~/lib/sqlsync";
import stylesHref from "./index.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesHref },
];

export default function Application() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AuthProvider>
          <ConnectedProvider>
            <Outlet />
          </ConnectedProvider>
        </AuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
