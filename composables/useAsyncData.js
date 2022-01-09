import { getCurrentInstance, withAsyncContext } from 'vue'

const initStateKey = '__ALVORI_INITIAL_STATE__'
let initState = typeof window !== 'undefined' ? window[initStateKey] : null
let cid = 0

const useAsyncData = async (cb) => {
    const fn = typeof window === 'undefined' ? () => handleSSR(id, cb) : () => handleCSR(cb)
    let id = 0,
        data,
        __temp,
        __restore
    data = (([__temp, __restore] = withAsyncContext(fn)), (__temp = await __temp), __restore(), __temp)
    return data
}

const handleCSR = async (cb) => {
    cid++
    let data
    if (checkInitState()) {
        data = initState.data[cid].data
        isLastCmp() && cleanInitState()
    } else {
        data = await cb()
    }
    return data
}

const handleSSR = async (id, cb) => {
    const vm = getCurrentInstance()
    const data = await cb()
    id = Object.keys(vm.appContext.config.globalProperties.$asyncData).length + 1
    vm.appContext.config.globalProperties.$asyncData[id] = {
        data: data,
        mounted: false,
    }
    return data
}

const checkInitState = () => {
    if (!window.hasOwnProperty(initStateKey)) return false
    if (!initState) return false
    if (typeof initState.data[cid] === 'undefined') return false
    if (!initState.data[cid].mounted && initState.data !== null) return true
}

const isLastCmp = () => {
    const keys = Object.keys(initState.data)
    const last = keys[keys.length - 1]
    return cid === +last ? true : false
}

const cleanInitState = () => {
    const state = document.getElementById('init-state')
    if (!state) return
    state.remove()
    window[initStateKey] = null
    initState = null
}

// const initStateKey = '__ALVORI_INITIAL_STATE__'
// let initState = typeof window !== 'undefined' ? window[initStateKey] : null
// let cid = 0

// const useAsyncData = async (data, cb) => {
//     console.log('mjs')
//     const isSSR = typeof window === 'undefined'
//     const vm = getCurrentInstance()
//     let id = 0
//     // console.log(vm.setupState)
//     isSSR ? handleSSR(id, cb) : await handleCSR(vm,data, cb)
//     // console.log(vm.setupState)
//     // seCurrentInstance(vm)
// }

// const handleCSR = async (vm, data, cb) => {
//     cid++
//     await handleCallback(cb)
//     handleInitState(data, vm)
// }

// const handleCallback = async (cb) => {
//     if (!window.hasOwnProperty(initStateKey) || !window[initStateKey]) {
//         return await new Promise((resolve) => {
//             cb().then(() => {
//                 resolve()
//             })
//         })
//     }
// }

// const handleSSR = (id, cb) => {
//     // const vm = getCurrentInstance()
//     // vm.type.serverPrefetch = async function () {
//     //     await cb()
//     //     id = Object.keys(vm.appContext.config.globalProperties.$asyncData).length + 1
//     //     vm.appContext.config.globalProperties.$asyncData[id] = {
//     //         data: vm.setupState,
//     //         mounted: false,
//     //     }
//     // }
// }

// const handleInitState = async (data, vm) => {
//     if (!checkInitState()) {
//         cleanInitState()
//         return
//     }
//     setupState(data, vm)
//     isLastCmp() && cleanInitState()
// }

// const checkInitState = () => {
//     if (!window.hasOwnProperty(initStateKey)) return false
//     if (!initState) return false
//     if (typeof initState.data[cid] === 'undefined') return false
//     if (!initState.data[cid].mounted && initState.data !== null) return true
// }

// const setupState = (data, vm) => {
//     for (let k in data) {
//         if (isRef(data[k])) {
//             if (typeof data[k].value !== 'undefined') {
//                 data[k].value = initState.data[cid].data[k]
//             }
//         } else {
//             for (let prop in data[k]) {
//                 data[k][prop] = initState.data[cid].data[k][prop]
//             }
//         }
//     }

//     // vm.setupState = Object.assign(vm.setupState, data)
//     // const currentState = vm.setupState
//     // vm.setupState = {
//     //     currentState,
//     //     ...data
//     // }
//     // console.log(vm.setupState, data)
// }

// const isLastCmp = () => {
//     const keys = Object.keys(initState.data)
//     const last = keys[keys.length - 1]
//     return cid === +last ? true : false
// }

// const cleanInitState = () => {
//     const state = document.getElementById('init-state')
//     if (!state) return
//     state.remove()
//     window[initStateKey] = null
//     initState = null
// }

export { useAsyncData }

