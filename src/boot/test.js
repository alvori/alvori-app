export default ({ app, router, ctx }) => {
    app.config.globalProperties.$test = `Sometest`
    console.log(ctx)
}
