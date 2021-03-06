<template>
    <div class="home">
        <input v-focus type="text" /><br>
        <a href="https://github.com/AlexxxRock/alvori-app" target="_blank">GitHub repository</a>
    </div>
</template>

<script>
import { useMeta } from "../plugins/meta";

export default {
    name: "Home",
    setup: (props, ctx) => {

        const meta = {
            title: 'Home',

            // titleTemplate: title => `${title} | Website`,

            meta: {
                description: {name: 'description', content: 'Home page'},
                keywords: { name: 'keywords', content: 'Alvori website' },
                equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
            },

            link: {
                material: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' }
            },

            htmlAttr: {
                'xmlns:cc': 'http://creativecommons.org/ns#', // generates <html xmlns:cc="http://creativecommons.org/ns#">,
                empty: undefined // generates <html empty>
            },

            bodyAttr: {
                'action-scope': 'xyz', // generates <body action-scope="xyz">
                empty: undefined // generates <body empty>
            },

            script: {
                ldJson: {
                    type: 'application/ld+json',
                    innerHTML: `{ "@context": "http://schema.org" }`
                }
            },

            noscript: {
                default: {
                    innerHTML: 'This is content for browsers with no JS (or disabled JS)'
                }
            }
        }

        useMeta(meta)
    }
};
</script>