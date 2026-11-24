# Tarkov.dev assets

These files are downloaded by `npm run assets:download`.

- `maps/regular.json`: regular-mode map data from the [Tarkov.dev JSON API](https://json.tarkov.dev/regular/maps).
- `maps/catalog.json` and `maps/svg/`: map catalog and SVG backgrounds from the [Tarkov.dev project](https://github.com/the-hideout/tarkov-dev) and its `assets.tarkov.dev` CDN.
- `icons/items.json`, `icons/items/`, and `images/items/`: item data, icons, and base images from the [Tarkov.dev JSON API](https://json.tarkov.dev/regular/items) and its asset links.

The API is community maintained. See [Tarkov.dev API documentation](https://tarkov.dev/api) for data sources and credits. `npm run assets:download -- --pve` fetches PvE map and item data instead.
