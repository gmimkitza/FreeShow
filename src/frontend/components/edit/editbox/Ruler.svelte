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
    let isDragging = false
    let currentIndent = 0
    let startMouseX = 0
    let startIndent = 0

    $: currentIndent = item?.specialStyle?.hangingIndent || 0

    function getTargetSlideItem(): { item: Item | null; slideId: string } {
        let slideId = ""
        let targetItem: Item | null = null

        if ($activeEdit.type === "overlay" && $activeEdit.id) {
            targetItem = $overlays[$activeEdit.id]?.items?.[index] || null
            slideId = $activeEdit.id
        } else if ($activeEdit.type === "template" && $activeEdit.id) {
            targetItem = $templates[$activeEdit.id]?.items?.[index] || null
            slideId = $activeEdit.id
        } else {
            const layoutRef = getLayoutRef()
            const slideRef = layoutRef[$activeEdit.slide!] || {}
            slideId = slideRef.id
            if ($activeShow && slideId) {
                targetItem = $showsCache[$activeShow]?.slides?.[slideId]?.items?.[index] || null
            }
        }

        return { item: targetItem, slideId }
    }

    function setIndentRealtime(val: number) {
        val = Math.max(0, Math.min(800, Math.round(val)))
        currentIndent = val

        if ($activeEdit.type === "overlay" && $activeEdit.id) {
            overlays.update((o) => {
                if (o[$activeEdit.id!]?.items?.[index]) {
                    if (!o[$activeEdit.id!].items[index].specialStyle) o[$activeEdit.id!].items[index].specialStyle = {}
                    o[$activeEdit.id!].items[index].specialStyle.hangingIndent = val
                }
                return o
            })
        } else if ($activeEdit.type === "template" && $activeEdit.id) {
            templates.update((t) => {
                if (t[$activeEdit.id!]?.items?.[index]) {
                    if (!t[$activeEdit.id!].items[index].specialStyle) t[$activeEdit.id!].items[index].specialStyle = {}
                    t[$activeEdit.id!].items[index].specialStyle.hangingIndent = val
                }
                return t
            })
        } else {
            const layoutRef = getLayoutRef()
            const slideRef = layoutRef[$activeEdit.slide!] || {}
            if ($activeShow && slideRef.id) {
                showsCache.update((cache) => {
                    const slide = cache[$activeShow!]?.slides?.[slideRef.id]
                    if (slide?.items?.[index]) {
                        if (!slide.items[index].specialStyle) slide.items[index].specialStyle = {}
                        slide.items[index].specialStyle.hangingIndent = val
                    }
                    return cache
                })
            }
        }
    }

    function commitIndent(val: number) {
        const { slideId } = getTargetSlideItem()
        if (!slideId) return

        if ($activeEdit.type === "overlay" || $activeEdit.type === "template") {
            const store = $activeEdit.type === "overlay" ? $overlays : $templates
            const currentItem = store[$activeEdit.id!]?.items?.[index]
            const specialStyle = clone(currentItem?.specialStyle || {})
            specialStyle.hangingIndent = val

            history({
                id: "UPDATE",
                oldData: { id: $activeEdit.id },
                newData: { key: "items", subkey: "specialStyle", data: [specialStyle], indexes: [index] },
                location: { page: "edit", id: $activeEdit.type + "_items", override: "hangingIndent_" + index }
            })
        } else {
            const currentItem = $showsCache[$activeShow!]?.slides?.[slideId]?.items?.[index]
            const specialStyle = clone(currentItem?.specialStyle || {})
            specialStyle.hangingIndent = val

            history({
                id: "setItems",
                newData: { specialStyle },
                location: { page: "edit", show: $activeShow!, slide: slideId, items: [index], override: "hangingIndent_" + slideId + "_" + index }
            })
        }
    }

    function onMarkerMouseDown(e: MouseEvent) {
        e.preventDefault()
        e.stopPropagation()

        isDragging = true
        startMouseX = e.clientX
        startIndent = currentIndent

        window.addEventListener("mousemove", onWindowMouseMove)
        window.addEventListener("mouseup", onWindowMouseUp)
    }

    function onRulerMouseDown(e: MouseEvent) {
        if (!rulerElem) return
        e.preventDefault()
        e.stopPropagation()

        const rect = rulerElem.getBoundingClientRect()
        const clickXInSlide = (e.clientX - rect.left) / ratio
        const snapped = Math.max(0, Math.round(clickXInSlide / 5) * 5)

        setIndentRealtime(snapped)
        commitIndent(snapped)

        // continue dragging
        isDragging = true
        startMouseX = e.clientX
        startIndent = snapped

        window.addEventListener("mousemove", onWindowMouseMove)
        window.addEventListener("mouseup", onWindowMouseUp)
    }

    function onWindowMouseMove(e: MouseEvent) {
        if (!isDragging) return
        const deltaX = (e.clientX - startMouseX) / ratio
        const snapped = Math.max(0, Math.round((startIndent + deltaX) / 5) * 5)
        setIndentRealtime(snapped)
    }

    function onWindowMouseUp() {
        if (!isDragging) return
        isDragging = false
        commitIndent(currentIndent)

        window.removeEventListener("mousemove", onWindowMouseMove)
        window.removeEventListener("mouseup", onWindowMouseUp)
    }
</script>

<!-- Ruler track bar above textbox -->
<div
    bind:this={rulerElem}
    class="ruler-bar"
    class:dragging={isDragging}
    on:mousedown={onRulerMouseDown}
    title="Ruler / Penggaris Indentasi (Klik atau geser marker untuk mengubah jarak dialog)"
>
    <!-- Left margin indicator (0px) -->
    <div class="zero-marker">
        <div class="zero-line"></div>
        <span class="zero-label">0</span>
    </div>

    <!-- Tick marks -->
    <div class="ticks-container">
        {#each [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 250, 300, 350, 400] as tickPos}
            <div
                class="tick"
                class:major={tickPos % 100 === 0}
                class:medium={tickPos % 50 === 0 && tickPos % 100 !== 0}
                style="left: {tickPos}px;"
            >
                {#if tickPos % 100 === 0}
                    <span class="tick-label">{tickPos}</span>
                {/if}
            </div>
        {/each}
    </div>

    <!-- Draggable hanging indent marker -->
    <div
        class="indent-marker"
        style="left: {currentIndent}px;"
        on:mousedown={onMarkerMouseDown}
    >
        <!-- Triangle pointer -->
        <div class="marker-head" title="Indent: {currentIndent}px">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <polygon points="0,0 12,0 6,10" />
            </svg>
            {#if isDragging || currentIndent > 0}
                <div class="marker-tooltip">{currentIndent}px</div>
            {/if}
        </div>

        <!-- Vertical guide line dropping through text while dragging -->
        {#if isDragging}
            <div class="guide-line"></div>
        {/if}
    </div>
</div>

<style>
    .ruler-bar {
        position: absolute;
        top: -24px;
        left: 0;
        width: 100%;
        height: 22px;
        background: rgba(18, 18, 26, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 3px 3px 0 0;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.35);
        cursor: crosshair;
        user-select: none;
        pointer-events: auto;
        z-index: 1000;
        overflow: visible;
    }

    .ruler-bar.dragging {
        cursor: ew-resize;
    }

    .zero-marker {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        pointer-events: none;
    }

    .zero-line {
        position: absolute;
        top: 0;
        left: 0;
        width: 2px;
        height: 100%;
        background: var(--primary, #00d2ff);
    }

    .zero-label {
        position: absolute;
        top: 2px;
        left: 4px;
        font-size: 9px;
        font-weight: bold;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1;
    }

    .ticks-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
    }

    .tick {
        position: absolute;
        bottom: 0;
        width: 1px;
        height: 4px;
        background: rgba(255, 255, 255, 0.25);
    }

    .tick.medium {
        height: 8px;
        background: rgba(255, 255, 255, 0.45);
    }

    .tick.major {
        height: 12px;
        background: rgba(255, 255, 255, 0.7);
    }

    .tick-label {
        position: absolute;
        top: -12px;
        left: 2px;
        font-size: 8px;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1;
    }

    .indent-marker {
        position: absolute;
        top: 0;
        width: 0;
        height: 100%;
        cursor: ew-resize;
        pointer-events: auto;
        z-index: 1001;
    }

    .marker-head {
        position: absolute;
        top: 1px;
        left: -6px;
        width: 12px;
        height: 14px;
        color: var(--secondary, #ff4081);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8));
        transition: transform 0.1s ease;
    }

    .marker-head:hover {
        transform: scale(1.2);
        color: #ff80ab;
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
        padding: 2px 5px;
        border-radius: 3px;
        white-space: nowrap;
        pointer-events: none;
        margin-bottom: 4px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }

    .guide-line {
        position: absolute;
        top: 22px;
        left: 0;
        width: 1px;
        height: 800px;
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
</style>
