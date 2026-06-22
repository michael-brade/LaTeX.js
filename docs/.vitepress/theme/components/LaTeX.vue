<!-- LaTeX logo -->
<template>
  <span class="latex">L<span>a</span>T<span>e</span>X</span>
</template>

<style scoped lang="scss">
.latex span {
    text-transform: uppercase;

    &:first-child {
        font-size: 0.8em;
        vertical-align: 0.2em;
        margin-left: -0.4em;
        margin-right: -0.1em;
    }

    &:last-child {
        margin-left: -0.2em;
        margin-right: -0.1em;
        position: relative;
        top: 0.45ex;
    }
}
</style>
