import { ref, computed } from 'vue'


export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 4

// one 10% step per wheel notch; browsers report very different deltas for a notch (Firefox ~ 170px,
// Chromium ~ 70px), so ignore its size. Trackpad pinch sends many small deltas instead: sum them up
// until they are worth a notch.
const WHEEL_STEP = 40   // px


/**
 * Zoom state for the buttons and Ctrl+wheel (also trackpad pinch).
 * @param onChange called with the new zoom factor
 */
export function useZoom(onChange: (zoom: number) => void)
{
    const zoom = ref(1)

    const zoomTo = (z: number) => {
        zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100))
        onChange(zoom.value)
    }

    // step to the next multiple of 10%
    const zoomIn = () => zoomTo(Math.floor(zoom.value * 10 + 1e-6) / 10 + 0.1)
    const zoomOut = () => zoomTo(Math.ceil(zoom.value * 10 - 1e-6) / 10 - 0.1)

    let wheelSum = 0

    const onWheel = (e: WheelEvent) => {
        // zoom with Ctrl or Meta/Cmd
        if (!e.ctrlKey && !e.metaKey) return

        // don't zoom the whole page
        e.preventDefault()

        const multiplier =
            e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 33 :
            e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 400 :
            1

        const dy = e.deltaY * multiplier

        // ignore 0-delta events so they don't accidentally reset wheelSum (Math.sign(0) === 0)
        if (dy === 0) return

        if (Math.sign(dy) !== Math.sign(wheelSum))
            wheelSum = 0            // changed direction -> reset

        wheelSum += dy

        if (Math.abs(wheelSum) >= WHEEL_STEP) {
            wheelSum < 0 ? zoomIn() : zoomOut()
            wheelSum = 0 // Discard remainder so 1 notch = 1 step
        }
    }

    return {
        zoom,
        canZoomIn: computed(() => zoom.value < MAX_ZOOM),
        canZoomOut: computed(() => zoom.value > MIN_ZOOM),
        zoomTo,
        zoomIn,
        zoomOut,
        onWheel
    }
}
