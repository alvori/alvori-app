import { reactive } from 'vue'

let ready
const isSSR = typeof window === 'undefined'

const store = reactive({
    meta: null,
})

const useMeta = (data) => {
    if (!isSSR) {
        for (let item in data) {
            if (item === 'title') {
                document.title = data[item] || ''
            } else if (['meta', 'link', 'script', 'noscript'].includes(item)) {
                for (let key in data[item]) {
                    let el = document.querySelector(`${item}[data-meta=${key}]`)
                    createOrUpdate(el, key, item, data[item][key])
                }
            } else if (['htmlAttr', 'bodyAttr'].includes(item)) {
                setBodyHtmlAttrs(item, data[item])
            }
        }
    } else {
        const meta = {
            head: ``,
            bodyAttr: ``,
            htmlAttr: ``,
            body: ``,
        }

        for (let item in data) {
            if (item === 'title') {
                meta.head = meta.head + `<title>${data[item]}</title>`
            } else if (['meta', 'link'].includes(item)) {
                for (let key in data[item]) {
                    let el = `<${item}`
                    for (let attr in data[item][key]) {
                        el += ` ${attr}="${data[item][key][attr]}"`
                    }
                    el = el + ` data-meta="${key}" />`
                    meta.head = meta.head + el
                }
            } else if (['script', 'noscript'].includes(item)) {
                for (let key in data[item]) {
                    let el = `<${item}`
                    for (let attr in data[item][key]) {
                        if (attr === 'innerHTML') continue
                        el += ` ${attr}="${data[item][key][attr]}"`
                    }
                    el = el + ` data-meta="${key}">${data[item][key]['innerHTML']}</${item}>`
                    item === 'script' ? (meta.head = meta.head + el) : (meta.body = meta.body + el)
                }
            } else if (['htmlAttr', 'bodyAttr'].includes(item)) {
                let attrs = ``
                for (let attr in data[item]) {
                    attrs += ` ${attr}="${data[item][attr] || ``}"`
                }
                meta[item] = attrs
            }

            store.meta = meta
        }
    }
    ready()
}

const createOrUpdate = (el, key, item, data) => {
    const parent = item === 'noscript' ? 'body' : 'head'
    el ? buildNode(el, key, data) : insert(parent, buildNode(document.createElement(item), key, data))
}

const buildNode = (node, key, data) => {
    for (let attr in data) {
        if (attr === 'innerHTML') {
            node.innerHTML = data.innerHTML || ``
            continue
        }
        node.setAttribute(attr, data[attr] || ``)
    }
    node.setAttribute('data-meta', key)
    return node
}

const setBodyHtmlAttrs = (node, data) => {
    let el = document.querySelector(node.replace('Attr', ``))
    for (let attr in data) {
        el.setAttribute(attr, data[attr] || ``)
    }
}

const insert = (parent, node) => {
    document.querySelector(parent).append(node)
}

const meta = {
    data: null,
    async install(app, options) {
        const readyPromise = new Promise((r) => {
            ready = r
        })
        this.data = null
        await readyPromise
        this.data = store.meta
    },
}

export { useMeta, meta }
