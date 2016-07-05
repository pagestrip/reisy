# reisy

> runtime extendable inline styles

reisy is a system to define stylesheets. But it can do a lot more. Read the
following examples to find out what’s in store for you.

reisy consists of two parts. A *runtime library* that resolves and constructs
stylessheets and properties, and a *babel plugin* that allows you to author
your style definitions inline with your JS, using a CSS-like language. The
following examples will use this CSS-like syntax to walk you through all of
reisys features.


## basic styling

You can use reisy to write CSS rules just like you are used to do.

```css
html, body {
	margin: 0;
	padding: 0;
	min-height: 100%;
}
.my-class {
	display: none;
}
```

reisy will just generate the exact same CSS for you. Pretty boring so far.


## prefixing

Consider this css:

```css
@keyframes foo {
	0% { width: 0%; }
	100% { width: 100%; }
}
.my-class {
	animation: foo 1s infinite linear;
}
```

reisy does autoprefixing for obsolete browsers, so it will generate the
following css for you:

```css
@keyframes foo {
	0% { width: 0%; }
	100% { width: 100%; }
}
@-webkit-keyframes foo {
	0% { width: 0%; }
	100% { width: 100%; }
}
.my-class {
	animation: foo 1s infinite linear;
	-webkit-animation: foo 1s infinite linear;
}
```


## nesting

Reisy does nesting for your CSS, so you don’t have to repeat selectors all
over.

```css
.my-class {
	color: blue;
	&:hover {
		color: red;
	}
	em, strong {
		color: green;
	}
	@media foo {
		color: yellow;
	}
}
```

reisy will generate the following CSS for you:

```css
.my-class {
	color: blue;
}
.my-class:hover {
	color: red;
}
.my-class em, .my-class strong {
	color: green;
}
@media foo {
	.my-class {
		color: yellow;
	}
}
```

This does not only save you some typing and keeps your media queries close to
the components who rely on them, it also interacts with following feature.


## namespaces / registry

One of the pitfalls of CSS is its single global namespace which means you have
to rely on best practices like BEM or SUIT for naming things.

reisy can be a lot more convenient when styling your components since it
supports namespaces and automatically generates CSS classNames for you.

```css
@namespace Header;

Container {
	width: 100%;
}
```

This will generate the following CSS during development:

```css
.Header-Container {
	width: 100%;
}
```

When running in production, it will use a short hash instead of the readable
className above. So how do you actually know which classNames reisy chose for
your component? You can tell reisy to expose the whole namespace, like so:

```js
reisy.namespace("Header")
// =
{
  Container: "Header-Container",
}
```


## mixins (extends)

reisy also supports mixins, or extends as we call them.

```css
@namespace Helpers;

Blue {
	color: blue;
}

@namespace Header;

Container {
	@extends Helpers.Blue;
	width: 100%;
}
```

Now this will yield the following CSS:

```css
.Helpers-Blue {
	color: blue;
}
.Header-Container {
	width: 100%;
}
```

Another pitfall of CSS is that with same specificity, the precedence depends on
the source order of the rules. With reisy, this is not a problem, since reisy
knows to order mixins before users, so users of mixins will always override
properties because of source order.

Also note that the additional className is exposed to the namespace described
in the section before like so: `{Container: "Helpers-Blue Header-Container"}`


## variables and interpolation

But there is more. reisy supports variables and references.

```css
@namespace Global;

TextColor: white;

@namespace Header;

Height: 100;

@keyframes Anim {
	0% { width: 0%; }
	100% { width: 100%; }
}

Container {
	color: $Global.TextColor;
	height: $(Height)px;
	animation: $Anim 1s infinite;
}
```

This will generate the following CSS (excluding autoprefixes):

```css
@keyframes Header-Anim {
	0% { width: 0%; }
	100% { width: 100%; }
}

.Header-Container {
	color: white;
	height: 100px;
	animation: Header-Anim 1s infinite;
}
```

So reisy will also automatically generate names for your keyframes which will
be minified in production.

And the reason reisy generates this CSS at runtime is that you can override any
one of those properties, and in fact also extend your rules using overrides
specified at runtime.

## using variables in code

reisys variables can not only be used inside CSS rules, but are exposed to JS
code the same way that automatically generated classNames are. They are also
propagated through to all the uses and can be extended. You can also define
variables with type boolean and number!

```css
@namespace Settings;

Branding: true;

@namespace Theme;

HeaderType: 1;

@namespace Header;

Branding: $Settings.Branding;
Type: $Theme.HeaderType;
```

After resolving the reisy rules, your `Header` namespace will expose the
following properties for you:

```js
reisy.namespace("Header")
// =
{
	Branding: true,
	Type: 1,
}
```

So you can conditionally hide elements depending on `Branding` and do a map
lookup for your component using `Type`. And as with the rest of reisy, all
these properties can be overridden at runtime.
