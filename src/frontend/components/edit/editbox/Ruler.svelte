<script lang="ts">
    import type { Item } from "../../../../types/Show"
    import { activeEdit, activeShow, overlays, showsCache, templates } from "../../../stores"
    import { clone } from "../../helpers/array"
    import { history } from "../../helpers/history"
    import { getLayoutRef } from "../../helpers/show"
    import { _show } from "../../helpers/shows"

    export let item: Item | null
    export let index: number
    export let ratio: number = 1

    let rulerElem: HTMLElement | null = null

    // Drag state
    type DragType = "firstLine" | "hanging" | "tab" | null
    let activeDragType: DragType = null
    let activeDragIndex = -1
    let isMarkedForDelete = false

    let startMouseX = 0
    let startMouseY = 0
    let startVal = 0

    // Local values
    let firstLineIndent = 0
    let hangingIndent = 90
    let tabStops: number[] = [90]

    $: {
        firstLineIndent = item?.specialStyle?.firstLineIndent || 0
        hangingIndent = item?.specialStyle?.hangingIndent !== undefined ? item.specialStyle.hangingIndent : 90
        tabStops = Array.isArray(item?.specialStyle?.tabStops) && item.specialStyle.tabStops.length
            ? [...item.specialStyle.tabStops].sort((a, b) => a - b)
            : [hangingIndent]
    }

    function getTargetSlideId(): string {
        if ($activeEdit.type === "overlay" && $activeEdit.id) return $activeEdit.id
        if ($activeEdit.type === "template" && $activeEdit.id) return $activeEdit.id
        const layoutRef = getLayoutRef()
        return layoutRef[$activeEdit.slide!]?.id || ""
    }

    function updateSpecialStyleRealtime(patch: Record<string, any>) {
        if ($activeEdit.type === "overlay" && $activeEdit.id) {
            overlays.update((o) => {
                if (o[$activeEdit.id!]?.items?.[index]) {
                    if (!o[$activeEdit.id!].items[index].specialStyle) o[$activeEdit.id!].items[index].specialStyle = {}
                    Object.assign(o[$activeEdit.id!].items[index].specialStyle, patch)
                }
                return o
            })
        } else if ($activeEdit.type === "template" && $activeEdit.id) {
            templates.update((t) => {
                if (t[$activeEdit.id!]?.items?.[index]) {
                    if (!t[$activeEdit.id!].items[index].specialStyle) t[$activeEdit.id!].items[index].specialStyle = {}
                    Object.assign(t[$activeEdit.id!].items[index].specialStyle, patch)
                }
                return t
            })
        } else {
            const slideId = getTargetSlideId()
            if ($activeShow && slideId) {
                showsCache.update((cache) => {
                    const slide = cache[$activeShow!]?.slides?.[slideId]
                    if (slide?.items?.[index]) {
                        if (!slide.items[index].specialStyle) slide.items[index].specialStyle = {}
                        Object.assign(slide.items[index].specialStyle, patch)
                    }
                    return cache
                })
            }
        }
    }

    function commitSpecialStyle(patch: Record<string, any>) {
        const slideId = getTargetSlideId()
        if (!slideId) return

        if ($activeEdit.type === "overlay" || $activeEdit.type === "template") {
            const store = $activeEdit.type === "overlay" ? $overlays : $templates
            const currentItem = store[$activeEdit.id!]?.items?.[index]
            const specialStyle = clone(currentItem?.specialStyle || {})
            Object.assign(specialStyle, patch)

            history({
                id: "UPDATE",
                oldData: { id: $activeEdit.id },
                newData: { key: "items", subkey: "specialStyle", data: [specialStyle], indexes: [index] },
                location: { page: "edit", id: $activeEdit.type + "_items", override: "rulerStyle_" + index }
            })
        } else {
            const currentItem = $showsCache[$activeShow!]?.slides?.[slideId]?.items?.[index]
            const specialStyle = clone(currentItem?.specialStyle || {})
            Object.assign(specialStyle, patch)

            history({
                id: "setItems",
                newData: { specialStyle },
                location: { page: "edit", show: $activeShow!, slide: slideId, items: [index], override: "rulerStyle_" + slideId + "_" + index }
            })
        }
    }

    // --- Tab Stops Management ---

    function onRulerMouseDown(e: MouseEvent) {
        if (!rulerElem || activeDragType) return
        e.preventDefault()
        e.stopPropagation()

        const rect = rulerElem.getBoundingClientRect()
        const clickXInSlide = (e.clientX - rect.left) / ratio
        const snapped = Math.max(10, Math.round(clickXInSlide / 5) * 5)

        // If clicked on empty ruler space, add new Tab Stop (Word L-marker)
        const updatedTabs = [...tabStops, snapped].sort((a, b) => a - b)
        tabStops = updatedTabs
        const newIndex = updatedTabs.indexOf(snapped)

        updateSpecialStyleRealtime({ tabStops: updatedTabs })
        commitSpecialStyle({ tabStops: updatedTabs })

        // Immediately start dragging the newly created tab stop
        activeDragType = "tab"
        activeDragIndex = newIndex
        startMouseX = e.clientX
        startMouseY = e.clientY
        startVal = snapped
        isMarkedForDelete = false

        window.addEventListener("mousemove", onWindowMouseMove)
        window.addEventListener("mouseup", onWindowMouseUp)
    }

    function onFirstLineMouseDown(e: MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        activeDragType = "firstLine"
        startMouseX = e.clientX
        startMouseY = e.clientY
        startVal = firstLineIndent

        window.addEventListener("mousemove", onWindowMouseMove)
        window.addEventListener("mouseup", onWindowMouseUp)
    }

    function onHangingMouseDown(e: MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        activeDragType = "hanging"
        startMouseX = e.clientX
        startMouseY = e.clientY
        startVal = hangingIndent

        window.addEventListener("mousemove", onWindowMouseMove)
        window.addEventListener("mouseup", onWindowMouseUp)
    }

    function onTabMouseDown(e: MouseEvent, tIndex: number) {
        e.preventDefault()
        e.stopPropagation()
        activeDragType = "tab"
        activeDragIndex = tIndex
        startMouseX = e.clientX
        startMouseY = e.clientY
        startVal = tabStops[tIndex] || 0
        isMarkedForDelete = false

        window.addEventListener("mousemove", onWindowMouseMove)
        window.addEventListener("mouseup", onWindowMouseUp)
    }

    function deleteTab(e: MouseEvent, tIndex: number) {
        e.preventDefault()
        e.stopPropagation()
        const updated = tabStops.filter((_, i) => i !== tIndex)
        tabStops = updated
        updateSpecialStyleRealtime({ tabStops: updated })
        commitSpecialStyle({ tabStops: updated })
    }

    function onWindowMouseMove(e: MouseEvent) {
        if (!activeDragType) return
        const deltaX = (e.clientX - startMouseX) / ratio
        const deltaY = (e.clientY - startMouseY) / ratio
        const snapped = Math.max(0, Math.round((startVal + deltaX) / 5) * 5)

        if (activeDragType === "firstLine") {
            firstLineIndent = snapped
            updateSpecialStyleRealtime({ firstLineIndent: snapped })
        } else if (activeDragType === "hanging") {
            hangingIndent = snapped
            updateSpecialStyleRealtime({ hangingIndent: snapped })
        } else if (activeDragType === "tab" && activeDragIndex > -1) {
            // If dragged down vertically (> 25px off ruler), mark for deletion
            isMarkedForDelete = deltaY > 25

            const updated = [...tabStops]
            updated[activeDragIndex] = snapped
            tabStops = updated
            updateSpecialStyleRealtime({ tabStops: updated })
        }
    }

    function onWindowMouseUp() {
        if (!activeDragType) return

        if (activeDragType === "firstLine") {
            commitSpecialStyle({ firstLineIndent })
        } else if (activeDragType === "hanging") {
            commitSpecialStyle({ hangingIndent })
        } else if (activeDragType === "tab" && activeDragIndex > -1) {
            if (isMarkedForDelete) {
                // Delete tab stop
                const updated = tabStops.filter((_, i) => i !== activeDragIndex).sort((a, b) => a - b)
                tabStops = updated
                updateSpecialStyleRealtime({ tabStops: updated })
                commitSpecialStyle({ tabStops: updated })
            } else {
                const updated = [...tabStops].sort((a, b) => a - b)
                tabStops = updated
                // Also align hangingIndent with first tab if desired
                updateSpecialStyleRealtime({ tabStops: updated })
                commitSpecialStyle({ tabStops: updated })
            }
        }

        activeDragType = null
        activeDragIndex = -1
        isMarkedForDelete = false

        window.removeEventListener("mousemove", onWindowMouseMove)
        window.removeEventListener("mouseup", onWindowMouseUp)
    }

    // Units: 50px per numbered unit (1, 2, 3, 4, 5... up to 35 units = 1750px)
    const unitStep = 50
    const totalUnits = 36
</script>

<!-- Word-style Ruler Bar above Textbox -->
<div
    bind:this={rulerElem}
    class="word-ruler"
    class:dragging={!!activeDragType}
    on:mousedown={onRulerMouseDown}
    title="Penggaris ala Word: Klik untuk menambah titik Tab (L), geser tanda untuk mengatur jarak, tarik ke bawah untuk menghapus."
>
    <!-- Ruler Scale / Tick Marks -->
    <div class="scale-track">
        <!-- Zero / Margin Start -->
        <div class="zero-point">
            <span class="zero-num">0</span>
        </div>

        {#each Array.from({ length: totalUnits }) as _, uIdx}
            {@const uNum = uIdx + 1}
            {@const unitPx = uNum * unitStep}

            <!-- Sub-ticks: 10px, 20px, 25px(med), 30px, 40px -->
            <div class="tick small" style="left: {unitPx - 40}px;"></div>
            <div class="tick small" style="left: {unitPx - 30}px;"></div>
            <div class="tick medium" style="left: {unitPx - 25}px;"></div>
            <div class="tick small" style="left: {unitPx - 20}px;"></div>
            <div class="tick small" style="left: {unitPx - 10}px;"></div>

            <!-- Major Unit Tick & Number (1, 2, 3...) -->
            <div class="tick major" style="left: {unitPx}px;">
                <span class="unit-number">{uNum}</span>
            </div>
        {/each}
    </div>

    <!-- LEFT MARGIN HANDLES (Word Top & Bottom Triangles) -->
    
    <!-- 1. Top Triangle: First Line Indent (⯆) -->
    <div
        class="indent-handle first-line-handle"
        style="left: {firstLineIndent}px;"
        on:mousedown={onFirstLineMouseDown}
        title="First Line Indent: {firstLineIndent}px (Posisi baris pertama)"
    >
        <svg class="triangle-top" width="10" height="8" viewBox="0 0 10 8" fill="currentColor">
            <polygon points="0,0 10,0 5,8" />
        </svg>
        {#if activeDragType === "firstLine"}
            <div class="guide-line"></div>
            <div class="marker-tooltip">{firstLineIndent}px</div>
        {/if}
    </div>

    <!-- 2. Bottom Triangle: Hanging Indent (⯅) -->
    <div
        class="indent-handle hanging-handle"
        style="left: {hangingIndent}px;"
        on:mousedown={onHangingMouseDown}
        title="Hanging Indent: {hangingIndent}px (Batas baris berikutnya yang membungkus)"
    >
        <svg class="triangle-bottom" width="10" height="8" viewBox="0 0 10 8" fill="currentColor">
            <polygon points="5,0 0,8 10,8" />
        </svg>
        {#if activeDragType === "hanging"}
            <div class="guide-line"></div>
            <div class="marker-tooltip">{hangingIndent}px</div>
        {/if}
    </div>

    <!-- MULTIPLE TAB STOPS (Word "L" Shape Markers) -->
    {#each tabStops as tabPos, tIndex}
        {@const isCurrentDragging = activeDragType === "tab" && activeDragIndex === tIndex}
        <div
            class="tab-marker"
            class:dragging={isCurrentDragging}
            class:deleting={isCurrentDragging && isMarkedForDelete}
            style="left: {tabPos}px;"
            on:mousedown={(e) => onTabMouseDown(e, tIndex)}
            on:dblclick={(e) => deleteTab(e, tIndex)}
            title="Tab Stop {tIndex + 1}: {tabPos}px (Geser untuk atur, tarik ke bawah / klik 2x untuk hapus)"
        >
            <!-- Authentic Word "L" tab stop icon -->
            <div class="tab-l-shape">
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square">
                    <path d="M2,1 L2,10 L9,10" />
                </svg>
            </div>

            {#if isCurrentDragging}
                <div class="guide-line"></div>
                <div class="marker-tooltip" class:delete-tip={isMarkedForDelete}>
                    {isMarkedForDelete ? "Lepas untuk hapus ×" : `Tab ${tIndex + 1}: ${tabPos}px`}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .word-ruler {
        position: absolute;
        top: -26px;
        left: 0;
        width: 100%;
        height: 24px;
        background: #252830;
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-bottom: 2px solid rgba(255, 255, 255, 0.45);
        border-radius: 4px 4px 0 0;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.45);
        cursor: crosshair;
        user-select: none;
        pointer-events: auto;
        z-index: 1000;
        overflow: visible;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .word-ruler.dragging {
        cursor: ew-resize;
    }

    .scale-track {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
    }

    .zero-point {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-left: 2px solid var(--primary, #00d2ff);
    }

    .zero-num {
        position: absolute;
        top: 2px;
        left: 4px;
        font-size: 9px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.65);
        line-height: 1;
    }

    .tick {
        position: absolute;
        bottom: 0;
        width: 1px;
        background: rgba(255, 255, 255, 0.22);
    }

    .tick.small {
        height: 3px;
    }

    .tick.medium {
        height: 6px;
        background: rgba(255, 255, 255, 0.4);
    }

    .tick.major {
        height: 10px;
        background: rgba(255, 255, 255, 0.65);
    }

    .unit-number {
        position: absolute;
        top: -12px;
        left: 2px;
        font-size: 8.5px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.55);
        line-height: 1;
    }

    /* INDENT HANDLES */
    .indent-handle {
        position: absolute;
        width: 10px;
        cursor: ew-resize;
        pointer-events: auto;
        z-index: 1002;
        color: #e0e0e0;
        transition: color 0.1s;
    }

    .indent-handle:hover {
        color: var(--primary, #00d2ff);
    }

    .first-line-handle {
        top: 0px;
        transform: translateX(-5px);
        height: 8px;
    }

    .hanging-handle {
        bottom: 0px;
        transform: translateX(-5px);
        height: 8px;
    }

    /* TAB STOP MARKERS (WORD "L" SHAPE) */
    .tab-marker {
        position: absolute;
        bottom: 0px;
        width: 10px;
        height: 14px;
        transform: translateX(-2px);
        cursor: ew-resize;
        pointer-events: auto;
        z-index: 1003;
        color: var(--secondary, #ff4081);
        transition: transform 0.1s, color 0.1s;
    }

    .tab-marker:hover {
        transform: translateX(-2px) scale(1.18);
        color: #ff80ab;
    }

    .tab-marker.deleting {
        color: #ff3333 !important;
        opacity: 0.6;
        transform: translateX(-2px) translateY(12px) scale(0.9);
    }

    .tab-l-shape {
        display: flex;
        align-items: flex-end;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
    }

    /* GUIDELINE DROPPING ACROSS TEXT */
    .guide-line {
        position: absolute;
        top: 24px;
        left: 2px;
        width: 1px;
        height: 850px;
        background: repeating-linear-gradient(
            to bottom,
            var(--secondary, #ff4081) 0px,
            var(--secondary, #ff4081) 4px,
            transparent 4px,
            transparent 8px
        );
        pointer-events: none;
        z-index: 999;
        opacity: 0.85;
    }

    .marker-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--secondary, #ff4081);
        color: #ffffff;
        font-size: 10px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 3px;
        white-space: nowrap;
        pointer-events: none;
        margin-bottom: 5px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    }

    .marker-tooltip.delete-tip {
        background: #d32f2f;
    }
</style>
