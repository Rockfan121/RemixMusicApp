# Remix Music App

From [Openwhyd repo](https://github.com/openwhyd/openwhyd):

> Openwhyd is a music curation service freely available at openwhyd.org. It was designed for music lovers who enjoy taking their time to find the best tracks and videos for their collection [...].

Remix Music App is an alternative interface (built with React Router v7) that lets its users play music from playlists created by Openwhyd users.

<img src="/screenshots/explorePlaylists.jpg" alt="Explore view" width="720" height="346"/>

<img src="/screenshots/playlist1.jpg" alt="Playlist view" width="720" height="346"/>


## Implemented features

Many features (concerning browsing music) are similar to Openwhyd, e.g.:
- listing recently added tracks by all users,
- listing those of them which are popular among the Openwhyd community (_Hot tracks_),
- browsing music added by a particular user,
- playing tracks from the aforementioned sources...

<img src="/screenshots/playlist2.jpg" alt="User's playlist" style="float: left; width: 48%;"/> <img src="/screenshots/likes.jpg" alt="User's likes" style="width: 48%;"/>

Besides, this interface tries to expand Openwhyd's features a bit. Thus, Remix Music App has also these features:
- a user can add playlists to favorites (data is saved to browser's localStorage),
- the app displays playlists that were recently played,
- the interface adapts to different screen sizes,
- music can be played in background,
- a user can choose from different color themes.

<img src="/screenshots/thLight.jpg" alt="Light theme" style="float: left; width: 31%;"/> <img src="/screenshots/thBlue.jpg" alt="Blue theme" style="float: left; width: 31%;"/> <img src="/screenshots/thPurple.jpg" alt="Purple theme" style="width: 31%;"/>

The app still lacks some important Openwhyd features (e.g. pagination) - they are to be added later.

## Development

- Remix/React Router v7 template: [jacob-ebey/remix-shadcn](https://github.com/jacob-ebey/remix-shadcn/)
- UI library: [shadcn/ui](https://ui.shadcn.com/)
- custom themes for shadcn/ui: generated with [ZippyStarter](https://zippystarter.com/tools/shadcn-ui-theme-generator)
- music API: [Openwhyd](https://github.com/openwhyd/openwhyd)
- music player: [React Player](https://github.com/CookPete/react-player)
