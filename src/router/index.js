import {
    createRouter,
    createMemoryHistory,
    createWebHistory
} from 'vue-router'

const isServer = typeof window === 'undefined'
const history = isServer ? createMemoryHistory('') : createWebHistory('/')
const routes = [{
        path: '/',
        name: 'Home',
        component: () => import( /* webpackChunkName: "home" */ '../views/Home'),//Home, //() => import('../layouts/BaseLayout'),
    },
    {
        path: '/about',
        name: 'About',
        component: () => import( /* webpackChunkName: "about" */ '../views/About'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: '404',
        component: () => import( /* webpackChunkName: "404" */ '../views/404')
    },
]

const router = createRouter({
    history,
    routes
})

export default router