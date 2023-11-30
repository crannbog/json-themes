*status: WIP // Jan 2024*

```
      _  _____  ____  _   _   _______ _    _ ______ __  __ ______  _____ 
     | |/ ____|/ __ \| \ | | |__   __| |  | |  ____|  \/  |  ____|/ ____|
     | | (___ | |  | |  \| |    | |  | |__| | |__  | \  / | |__  | (___  
 _   | |\___ \| |  | | . ` |    | |  |  __  |  __| | |\/| |  __|  \___ \ 
| |__| |____) | |__| | |\  |    | |  | |  | | |____| |  | | |____ ____) |
 \____/|_____/ \____/|_| \_|    |_|  |_|  |_|______|_|  |_|______|_____/ 
                                                                         
```

# JSON-THEMES

- [JSON-THEMES](#json-themes)
  - [Motivation](#motivation)
  - [Concept](#concept)
  - [Use the library](#use-the-library)
  - [Special Cases](#special-cases)
    - [backdropFilter support](#backdropfilter-support)
    - [gradients](#gradients)
  - [Future plans](#future-plans)
  - [Contribution](#contribution)
 
## Motivation

Today there are many awesome ways how to style your Web Frontends. But when it comes to theming, the amount of solution already shrinks down a lot. But why?

If you want to have multiple Themes in your application, there have been two big ways of how to achieve that.

1. Use a CSS-in-JS solution. While that's a valid and working approach, you'll soon notice two things that may distract you:
   - You can't no longer write CSS (or better: SCSS/LESS/...) and seperate component's code from styling nicely
   - It's hard to not end up with messy, unstructured code
1. Use CSS Variables or do everything with preprocessor toolings
   - CSS file sizes will explode
   - It's good enough to handle something like dark/light theme, but not something like multiple Customer's CI themes.

This is now where `json-themes` jumps in. With this library we want to achieve some core goals:

- Think of a theme as a configuration
- Seperate styling and styling variants from component's code (as much as possible)
- Keep the possibility to use CSS in JS or CSS Preprocessors for styling things not coming from a theme (Transforms, user-select, ...)
- Runtime-exchangeable and editable themes (not possible with preprocessor-only solutions!)
- Stay close to CSS's syntax, so no one has to learn anything new
- Full-Scale multiple Themes (not only dark/light) for a component library

Btw., when talking about "theming" we mean:

- Colors (including gradients, patterns, assets for backgrounds)
- Fonts
- Borders
- Containers (padding, width, height, ...)
- Assets (Font Files, Logos, Icons, ...)

We explicitly do exclude **Layout**. Not because it shouldn't be configurable, but because that's another topic with impact on an app's structure and other parts.

## Concept

A **Theme** is a **JSON-based Configuration** file, which is loaded during runtime or SSR. 

```JSON
{
    "name": "MyTheme",
    "basedOn": "BaseTheme",
    "version": "1.0.0",
    "meta": [],
    "globals": {},
    "sets": {},
    "components": {}
}
```

The basic structure divides the config into several parts. Most important:

- `globals`: Here you can place variables (just like CSS Variables) which will be available in the rest of the config via shortcut `"$$myVar"`. 
    - Variables are scopeable, example: `{ colors: { primary: "#3399DD" }}` will be accessible via `"$$colors.primary"`.
    - Variables can contain everything you also would write as a CSS Value, for example: `{ basicShadow: "1px 2px 5px rgba(0,0,0,0.5)"}`
- `sets`: Here you can define:
  - `colorSets`,
  - `borderSets`,
  - `fontSets`,
  - `boxSets`
  
  A Set is somehow like a mixin (you may know it from SCSS/LESS/...). The `boxSet` is special, since it consists of the three others.

- `components`: Here you will map BoxSets to your components. One component definition looks like this: 
```json
{
    "default": {
        "theming": "$$basicBox",
        "parts": { "option": "$$callToActionBoxDef" },
        "defaultProps": {}
    },
    "variants": {
        "callToAction": {
            "theming": "...",
            "parts": { "option": "$$callToActionBoxDef" },
            "defaultProps": {...}
        }
    }
}
```
  
The `components` part is where the real magic will happen. You can freely choose in all of your declared stylings or parts of it to compose the appearance of a component. Just not only once, but with variants! You now have the possibility to have multiple versions of the same component, just by theming! No need to declare all possible variants in your code (as long as they only differ in design). 

There are also `parts` to declare Stying for parts of your component. Imagine a molecular Component (like a ComboBox) which consists of multiple styleable parts. You may want to stay in control over all of them.

Additionally you can declare "defaultProps" which can be mapped to a component's defaultProps. Think of a textfield which has an inline button to delete its value. One customer want's a trashcan symbol, the other one an "X". That's now controllable only via this theming configuration, as long as your Component makes that controllable via its props.

Of course this leads to two consequences:

- A component library which should get themeable needs to include some tooling for each component to support theming with variants and defaultProps.
  - But: we have some hooks & examples here to help
- Your app, which consumes the themeable library, may rely on some variants of a component. If you exchange a theme by another that misses some component variant definitions, the UI may break. So not all theme configurations are exchangeable out of the Box! You need to make sure that all variants your app relies on are declared inside the config.

But that's not all. Nearly every block inside the config is extendable via for example `__extends: "$$basicBox`, and also a theme itself (`basedOn: "..."`). This means, as long as some themes only differ in color (black/white, ...) your second configuration can become really small. Inheritance is the key!

## Use the library

The library is designed to work in an environment looking like this:

- You have your own Component Library which should support heavy-duty theming
- Your library is based on React (with hooks)

Of course this also works for apps with a lot of atomic / molecular components as well.

Inside your component-library you then can just install `json-themes` via

```
npm install @crannbog/json-themes
```

While the library is designed to support runtime-exchangeable theme configs stored in JSON, it's recommended to have at least one theme specified as `export const ...` inside a typescript / javascript file - because here you will get full developer experience with all the options strongly typed - and it's there from the beginning, just to avoid style-flickering.

1. Somewhere in a `<Root>` Component or similar you now should wrap around the `<ThemingRoot />` component, which will provide a React Context where the theming is accessible through. Pass the `componentsList` and `themingConfig` props to load a theme into the context.

2. Now you will have to touch each component to make it support themes. The Hook `useThemingVariant("MyComponent", "myVariant", props)` can be used to resolve a theming name to a corresponding `className` and mixed props + defaultProps. Your Component's main Node should get this className. The component itself should get the `defaultProps`, maybe with some plausability checking.

```tsx

export const Button = (_props) => {
    const [variant, props] = useThemingVariant("Button", _props.variant || "default", _props);

    return (
        <button {...variant?.defaultProps} className={`my-button ${variant.className}`}>
            {props.children}
        </button>
    );
}

```


> *Q: Why should `props` get passed to the theming library?*
>
> A: To share (one-way) values / variables from theming config file with your component's code. 
> 
> You might have components where for example a color value may not only be used in CSS but also inside JS. To pass the variable coming from your theming config inside your component's code, `props` are used. Inside the theming config you can pass the values inside the `defaultProps` scope. If the prop is already existing, it will get overwritten!


3. Inside you're App's code you now will get a feeling of how many variants of a component you'll need. Typically you'll need a few button variants `[callToAction, default, menu, newsletter, ...]`, and for most of the other components only a default variant. Make sure that every theme you'll create has all the necessary variants, your App relies on.

4. You can compose dark/light themes either inside one theming config (with variants) or with a second (inherited) theming config. 
   1. The variants option has the advantage, that the dark/light switch will happen "in place", without style flickering
   2. The 2nd theme config option has the advantage, that you usually only have to replace the `globals.colors` section with new values. All custom variants are inherited by default. This way recommended.

5. A component Definition

## Special Cases

### backdropFilter support

The library supports specification of backdrop filters. Since they're not yet supported in all major browsers they're covered by a special definition format. Inside your theming config you can use them like following:

```json
{
      "backdropFilter": {
            "definition": "blur(2px) contrast(0.5)",
            "fallbackBackground": "rgba(55,55,55,0.67)"
      }
}
```

Internally this will result in usage of the CSS `@supports` to either provide the backdropFilter definition or the fallbackBackground. You still can make use of the normal `background` definition if you want to, but be aware that the fallbackBackground may overwrite it.

### gradients

You can define gradients for background color definitions. Foreground (text) is currently not supported because of weak browser support and bad performance.
The format does look like this:

```json
{
      "background": {
            "definition": "linear-gradient(#fff, #000)",
            "fallbackColor": "#888"
      }
}
```

In case you set one of those objects on foreground or other color definitions that are not background, it will fall back to the fallbackColor.

## Future plans

The library is still in an early phase of development. There may come critical renamings or changes of behavior soon.
Yet there are some plans of what the library will get & be in the future:

- Full automated testing
- Bulletproof config import checks
- Support for other frameworks than React
- More flexible output & control over the CSS generation
- In-place CSS replacement (currently it replaces a whole `<style>` Tag)
- Helpers to support import/export/edit configs inside the browser
- Additions to specify and visualize **Styleguides**
- Helpers to support loading fonts & basic assets (like a Logo)

There are also some things which this library won't be:

- A component library
- ... with base Configs (You'll defenitely need to create them from scratch)
- A layout / page builder / CMS / ... config system

## Contribution

This library is forked from CRCL GmbH, `@circle/json-themes`, by it's original author. Both versions might be maintained.

The library is still in an early phase of development. In case you just happened to stumble across it and think it sounds interesting, feel free to try it out or get in contact with us. If you need assistance to integrate this approach into your library, we may be able to help! ;)

