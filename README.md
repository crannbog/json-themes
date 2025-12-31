```
      _  _____  ____  _   _   _______ _    _ ______ __  __ ______  _____ 
     | |/ ____|/ __ \| \ | | |__   __| |  | |  ____|  \/  |  ____|/ ____|
     | | (___ | |  | |  \| |    | |  | |__| | |__  | \  / | |__  | (___  
 _   | |\___ \| |  | | . ` |    | |  |  __  |  __| | |\/| |  __|  \___ \ 
| |__| |____) | |__| | |\  |    | |  | |  | | |____| |  | | |____ ____) |
 \____/|_____/ \____/|_| \_|    |_|  |_|  |_|______|_|  |_|______|_____/ 
                                                                         
```

- [`json-themes`](#json-themes)
  - [why?](#why)
  - [mental model](#mental-model)
  - [highlights](#highlights)
  - [basic structure](#basic-structure)
    - [globals](#globals)
    - [sets](#sets)
    - [components](#components)
  - [what developers need to understand](#what-developers-need-to-understand)


# `json-themes`

## why?

There are hundrets of solutions for theming in modern web applications. The problem with most of these solutions is that they either require a lot of boilerplate code or they are not flexible enough to handle complex use cases. This library aims to provide a simple and flexible way to manage themes in your application via simple json notation.

## mental model

Modern apps usually are developed with component libraries, no matter what framework is around. 

During development, design and implementation often get mixed together. UI devs spend a huge time in *perfecting* ideas of designers, even if there are strong styleguides. This usually ends up in a strong coupling of design and functionality of the UI within code. **thats bad**, because it's hard to change the design once the UI exists.

What if design *is just data*? Just a config, which is loaded, and which a designer can build?

In web development, design is almost exclusivly bound to some CSS solution, since that's the language a browser can read for handling appearance of elements.

But CSS is not only used for design, it's also crucial for some functionalities of components and the layout of the application. Think of `z-index`, `contain: content`, `position` and so on... So a designer maybe should't get access to the code in form of writing his own CSS. Too much can go wrong.

`json-themes` is here to help: It takes the slice out of CSS syntax that covers 99% of what's really needed to define a "theme". That is:

- colors
- borders
- sizes
- fonts

It supports defining everything around it, including hover, focus, active and all the other pseudo-class styles; animation or transition durations. All described within a json document.

But the most important thing is: it's designed for inheritance, maybe even more than CSS itself!

Designers therefore have access to much more possibilites than just a collection of "fontColor, background-main, cta-background" variables, but literally everything is optional and covered by fallbacks.

This allows you to:

1. create individual, complex themes for your company with almost no limits of what CSS might be able to do when used directly within code
2. create a "dark mode" out of it in seconds
3. create a "high contrast mode" out of it in seconds
4. create 50 different sub-branded products out of it in minutes

Imagine you have you `main-theme` where you covered the whole component-library with styles. Every border-radius, every hover-focus-active color stuff is covered and bound to variables following your own, internal naming schema.

Now you can create `main-theme-dark`, inherit everything from `main-theme` and only rewrite some color-variables to get a whole dark-theme. It automatically merges everything else, from border-radius, fonts sizes and transition speed, to component variants and even default-props for your components!

And the best thing: the developer doesn't have to care, when and how many themes there will be! 

> ***design is just config.***

## highlights

- minimal package-size footprint
- clean seperation of component functionality vs design in your codebase
- use your own naming convention of your styleguide
- create unlimited theme variants easily based on inheritance
- style sub-parts of components limitless
- create component variants and set component's default props
- framework-independent
- works for SPA, MPA, SSR
- works during build AND runtime! If your framework/components support it, you can not only switch themes on client-side during runtime, you can even edit it live.

## basic structure

basic structure of the json-theme config file. You can choose a real JSON file, or a typescript file to support suggestions / typings.

```ts
{
  name:       "base",
  basedOn:    null,
  meta:       {},
  globals:    {},
  sets:       {},
  components: {}
}
```

### globals

`globals` is the section where you can place all the values given from your styleguide. Feel free to create nested structures.

> map your styleguide's values into variables

Example: 

```ts
globals: {
    colors: {
        white: "#fff",
        black: "#000",
        myCompanyMain: "#31e"
    },
    mappings: {
        // the $$-notation is used for referencing
        foreground: "$$colors.black",
        background: "$$colors.white",
        ctaBackground: "$$colors.myCompanyMain",
        ctaForeground: "$$colors.white"
    }
}
```

### sets

`sets` is the section where you can create reusable pieces of inheritable design parts. Like a CSS class, which you might want to reuse mutliple times.

Sets are splittet into "**colorSets**" (handling colors), "**borderSets**" (handling the size and style of borders), "**fontSets**" (handling font family and style) and last but not least "**boxSets**" (handling an overall component including sizing), including the reference to color-, font- and borderSets (those three are not used standalone). 

Why are those sets splitted? To improve re-usability. For example you might have a "Card" component, and a "Button" component, which share the same borderSet, but different colorSets (the button needs styles for hover, active, ...).

Remember, everything is meant to be re-used, to streamline the development of additional theme variants as fast as possible.

> map your variables into reusable, CSS-class like sets
>

### components

`components` is the final section where you can start mapping your design definitions into your component library. `json-themes` aims to let you use any component library which is not completely finished in styling.

Technically this lib just produces css classes and classNames which you have to apply to your component.

But in detail this section can do much more, especially more than almost any other theming solution.

This can be best explained using an example: InputField.

```ts

InputField: {
  // default = the default component variant.
  default: {
    theming: {
      __extends: "$$base" // refer to a boxSet named "base". All its values get included and can be overwritten by local other definitions
      height: "$$sizes.baseHeight" // refers to "globals" sizes { baseHeight: 3rem } for example
      colorSet: {
        foreground: "#234" // will get deep merged with existing color set
      }
    },
    // you can style sub-parts of your component with additional sets!
    parts: {
      clearButton: {
        colorSet: {
          // expects a colorSet named transparentButton
          __extends: "$$transparentButton"
        }
      }
    },
    // you can pass defaultProps to your component. This support needs to be implemented manually within the component!
    defaultProps: {
      isClearButtonVisible: true
    }
  },
  variants: {
    // create variants of your component for different styles. You might want to have a "variant" prop in your component. It auto-deep-merges the default theme; you have to define everything that's different
    ctaInputField: {
      __extends: "$$ctaElement",
      height: "5rem"
    }
  }
}

```

The idea of **parts** is to provide a solution to fine-granular style complex components. Imagine a full-blown modal dialog; there's much more than what you could achieve with only a linear set of properties. That's one of the things that makes this library special. With this it's no issue to have a "modalHeader" part within your component, where you can apply an existing "header2" boxSet. Or you can define a "modalBackground" part to style the color and blur of the background behind the open modal. Anything you might do with html+css is possible here, too.

The idea of **variants** is to provide an easy solution to have different variants of the same component. Easy example, the button: You might need a default, a primary, secondary or transparent - maybe a square-round icon button. Maybe something completely different. Here you have full freedom to create as much variants as you wish, with the names you already have within your styleguide.

The idea of **defaultProps** is to slightly extend the scope of `json-themes` - because sometimes the theme includes certain behavior which is outside of the scope of CSS. In your application this can be handled through component props. An example:

*You have a default's company theme, and want to create a special "snow" theme for the winter/christmas season. This includes several changes in colors and borders, but also should activate a "snowfall" animation in the background. You can have a **Root** component, where the animation will be located, and activte it through the props **showSnowAnimation: true**.*

Of course this relys on a corresponding implementation on the component's side. And of course this behavior is quite loose, so you can abuse it and completely blow the scope of this theming library - feel free to do so, if it matches your needs! In general, it's only meant for theming-related stuff.


## what developers need to understand

- develop components with flexibility in mind. avoid colors, sizes, font properties or other stuff which can be covered from `json-themes`. Especially keep CSS specificity in mind. https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity
- use CSS only for layout and functionality, not for appearance! (Or only for neutral fallbacks)
- you should definitely think about a simple base- or dev-theme 
- `json-themes` helps a little bit in terms of accessibility.
  - use `aria-current=true|page|step|location|date|time` to allow the `:current` pseudo-class for any component
  - use `aria-pressed=true|mixed` to allow a `pressed` state for elements
  - use `aria-checked=true|mixed` to allow a `:checked` pseudo class for any component
  - use `aria-invalid=true|grammar|spelling` to allow the `:invalid` pseudo class on any component
- `json-themes` will generate CSS. Each definition will result in a className which you can carefully insert on the right element of your component