<template>
    <div>
        <img src="./assets/logo.png" alt="" style="width: 160px; margin-top: 15vh" />
        <div class="logo">Alvori</div>
        <div class="subtitle">Freamwork for Vue.js v3</div>
        <nav id="nav">
            <router-link to="/">Home</router-link><span> | </span>
            <router-link to="/about">About</router-link>
        </nav>
        <router-view />
    </div>
</template>

<script>
export default {
    name: 'App',
}
</script>

<style lang="scss">
#app {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}
a {
    color: #00aae7;
}

.logo {
    text-decoration: none;
    color: #7d91f5;
    background: linear-gradient(0deg, #1dd1af, #7d91f5 75%, #7d91f5);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#7d91f5",endColorstr="#1dd1af",GradientType=0);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: #0b2349;
    display: block;
    text-transform: uppercase;
    font-size: 6rem;
    font-weight: 300;
    letter-spacing: 1rem;
    line-height: 1;
    margin: 0 0 1rem 0;
}
.subtitle {
    font-weight: 600;
    font-size: 1.6rem;
    color: #111;
}

#nav {
    padding: 30px;

    a {
        font-weight: bold;
        color: #2c3e50;

        &.router-link-exact-active {
            color: #00aae7;
        }
    }
}
</style>
