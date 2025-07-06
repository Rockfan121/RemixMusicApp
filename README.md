# Remix Music App

A Remix application for playing music from playlists created by Openwhyd users\
*This is WIP - the layout and some basic functionality is implemented for now.* 😉

## Implemented features

- browsing playlists created by a particular user (with a specified uid),
- listing tracks (and other data) of a chosen playlist,
- playing tracks from a chosen playlist,
- listing recently played playlists in a sidebar (using localStorage),
- listing favorite playlists in a sidebar (using localStorage).

## Development

- Remix template: [jacob-ebey/remix-shadcn](https://github.com/jacob-ebey/remix-shadcn/) (the template with a login flow and a SQLite database backed by Drizzle ORM)
- UI library: [shadcn/ui](https://ui.shadcn.com/)
- custom themes for shadcn/ui: generated with [ZippyStarter](https://zippystarter.com/tools/shadcn-ui-theme-generator)
- music API: [Openwhyd](https://github.com/openwhyd/openwhyd)
- music player: [React Player](https://github.com/CookPete/react-player)
