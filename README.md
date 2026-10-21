# QuadFit

A responsive personal coaching website customized by Arti Kumatr.

## Run locally

From the project folder, run:

```sh
python -m http.server 8000 --directory source
```

Open http://localhost:8000. You can also open `source/index.html` directly.

## Project structure

- `source/index.html`: page content and navigation.
- `source/styles.css` and `source/brand-system.css`: base layout and components.
- `source/theme.css`: shared QuadFit color and type tokens.
- `source/quadfit.css`: QuadFit sections, animations, and responsive styles.
- `source/script.js`: navigation, interactive sections, and assessment.
- `source/assets/images/`: images used by the website.

The stack is vanilla HTML, CSS, and JavaScript. No build step or package installation is required. Google Fonts is loaded externally. Coaching links open WhatsApp at +91 9766590226. The assessment runs in memory without saving or sending answers.

See `LICENSE.txt` for customization attribution and original template terms, and `ASSET-LICENSES.md` for asset provenance.
