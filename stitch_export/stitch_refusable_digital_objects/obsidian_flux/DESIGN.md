# Design System Specification: Precision Dark Mode

## 1. Overview & Creative North Star: "The Digital Architect"
The design system is built upon the philosophy of **The Digital Architect**. It moves away from the "approachable" roundedness of consumer apps toward a rigorous, high-fidelity environment that rewards technical precision. 

The aesthetic is characterized by a "High-End Editorial" lens: deep blacks, razor-sharp edges, and a deliberate use of monochromatic depth. We do not use shadows to create hierarchy; we use tonal luminance. The goal is to make the user feel they are operating a professional-grade instrument where every pixel has been audited for necessity.

### Creative North Star Principles:
*   **Intentional Asymmetry:** Break the grid with offset content blocks to guide the eye sequentially rather than through a sea of uniform boxes.
*   **Tonal Authority:** Use the darkest spectrum of the color palette to ground the UI, allowing the blue accent to act as a high-precision laser rather than a decorative flourish.
*   **The Breath of Logic:** High density in data areas is balanced by expansive negative space in navigation and headers, creating a premium "gallery" feel for the information.

---

## 2. Colors & Surface Logic

This system utilizes a "Deep Onyx" palette designed to eliminate visual noise. The core challenge is creating depth without relying on traditional shadows.

### The "No-Line" Rule
While the initial concept suggests 1px borders, this system evolves that into a **Tonal Distinction Rule**. Designers must prioritize sectioning through background shifts. Only use `outline_variant` (#474750) at a **20% opacity** when a boundary is strictly required for data density. Never use 100% opaque borders for large-scale layout sectioning.

### Surface Hierarchy & Nesting
Hierarchy is achieved through "Stacked Luminance." The deeper the element is in the logic tree, the more it "rises" in brightness.
*   **Base Layer:** `surface` (#0e0e11) — The canvas.
*   **Section Layer:** `surface_container_low` (#131317) — For large content blocks.
*   **Component Layer:** `surface_container` (#19191f) — For cards and primary modules.
*   **Interactive Layer:** `surface_container_high` (#1f1f26) — For hovers and active states.

### Accent & Feedback
*   **Primary Accent:** `primary` (#adc6ff) / `#3b82f6`. Use sparingly. It is a tool for action, not a brand ornament.
*   **The Signature Glow:** For main CTAs, use a 1px `primary` border with a `primary_container` (#004395) background. Do not use flat blue fills for large buttons; use the "Inverse Surface" approach for maximum contrast.

---

## 3. Typography: The Inter Grid

We use **Inter** exclusively. It is a typeface of engineering. To achieve the "expensive" look, we employ tight letter-spacing and varied weights to create a hierarchy of importance.

*   **Display (lg/md/sm):** `-0.04em` tracking. Semibold (600). Used for data highlights and major section headings.
*   **Headline & Title:** `-0.02em` tracking. Medium (500). Used for module headers.
*   **Body (lg/md/sm):** `-0.011em` tracking. Regular (400). Optimized for long-form technical reading.
*   **Labels (md/sm):** `+0.05em` tracking. Bold (700) or Medium (500). Always uppercase when used for metadata or category tags to create a "tabbed" editorial feel.

**Editorial Rule:** Never center-align typography in functional dashboards. Align to the "Hard Left" to maintain a structural vertical axis.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are prohibited. Depth is a result of light refraction and stacking.

*   **The Layering Principle:** Place a `surface_container_highest` (#25252d) element over a `surface_container_lowest` (#000000) backdrop to create an immediate sense of lift.
*   **Ambient Shadows:** If a floating menu or modal is required, use a shadow with a `40px` blur, `0%` spread, and the color `on_background` (#e6e4f0) at **4% opacity**. This creates a "light leak" effect rather than a "shadow."
*   **The Glassmorphism Fallback:** For floating navigation bars, use `surface_container` (#19191f) at **80% opacity** with a **12px backdrop-blur**. This ensures the UI feels like a single cohesive unit rather than disconnected floating panes.

---

## 5. Components

### Buttons & Actions
*   **Primary Action:** `on_surface` (#e6e4f0) background with `surface` (#0e0e11) text. This "High Contrast" inversion denotes the final step in a sequence. 
*   **Secondary/Sequential:** `surface_container_high` (#1f1f26) with a subtle `outline_variant` 1px border. 
*   **Ghost States:** No background, `on_surface_variant` text. High-contrast blue `primary` text only for "Add" or "New" actions.

### Cards & Modules
*   **Constraint:** No dividers inside cards. 
*   **Separation:** Use `8px` of vertical white space (from the `lg` spacing scale) and `label-sm` headers in `secondary` color to separate content types.
*   **Hover:** Transition the border from `outline_variant` at 20% to `primary` (#adc6ff) at 100% over 150ms.

### Form Elements
*   **Inputs:** Use `surface_container_lowest` (#000000) for the input field background to create a "recessed" look into the `surface_container` card.
*   **Toggles:** Minimalist 1:2 aspect ratio. Unselected: `surface_container_highest`. Selected: `primary` (#adc6ff). No "knob" shadow.
*   **Sliders:** A 2px track in `surface_container_highest` with a square 8px handle. Precision over softness.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `0.25rem` (DEFAULT) corner radius for almost everything. It feels sharper and more professional than large rounded corners.
*   **Do** use `on_surface_variant` (#abaab5) for secondary data to keep the visual hierarchy clear.
*   **Do** lean into the dark. Use `#000000` (surface_container_lowest) for areas where you want the user to focus intensely on text or code.

### Don't
*   **Don't** use 100% opaque grey borders. They "trap" the content. Use the Tonal Layering method first.
*   **Don't** use "Blue" for everything. Blue is a signal, not a theme. If the screen is 20% blue, the design has failed its minimal requirement.
*   **Don't** use icons without labels in primary navigation. A high-end tool prioritizes clarity over "clean" mystery meat navigation.