declare module '*.tex?raw' {
    const content: string
    export default content
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'

    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module '*.css'
