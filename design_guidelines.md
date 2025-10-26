# Design Guidelines: Love Letters - 3D Globe Visualization

## Design Philosophy
Create a minimalist, visually stunning work of digital art that feels private and poetic. The visualization should be opaque in meaning but visually captivating—prioritizing aesthetic beauty over explicit communication.

## Visual Identity

### Color Palette
- **Background**: Deep, rich black (#000000 or near-black)
- **Route Gradients**: 
  - Violet to cyan (#8B5CF6 → #00ffc3)
  - Magenta to blue (#ff4d94 → #00ffc3)
  - Luminous, shimmery appearance with slight motion/pulse along gradients to show direction
- **Origin Points**:
  - Deep green dot (#00ffc3) for one person
  - Light pink dot (#ff4d94) for the other person
  - Both should be tiny and glowing
- **Meetup Icons**: Golden (#FFD700) envelope with heart, softly shimmering

### Typography
- **Title Only**: "Love Letters" in faint white text
- **Placement**: Bottom corner, minimal and unobtrusive
- **No Other Text**: Except hover tooltips showing dates

## Layout & Structure

### Full-Screen Globe
- **Container**: 100vh full-screen immersive experience
- **No Map UI Chrome**: Remove all standard map controls except zoom/rotate functionality
- **Interactive**: Users can freely zoom, pan, and rotate the globe
- **Background Enhancement**: Optional faint shimmer overlay using particles for added depth

### Route Visualization
- **Arc Style**: Great-circle or Bezier curved arcs between points
- **Gradient Material**: Smooth WebGL gradients with luminous quality
- **Animation**: Subtle pulse or motion along the gradient to indicate direction of travel
- **Visual Weight**: Routes should feel like light trails across darkness

### Point Markers
- **Starting Points**: Tiny glowing dots (2-4px radius with glow effect)
  - Deep green for one origin
  - Light pink for the other origin
  - Soft pulsing glow animation
- **Meetup Points**: Small golden envelope icon with heart (SVG or Lottie)
  - Size: 24-32px
  - Subtle shimmer animation
  - Only appears where meetup: true in data

## Interactions

### Hover States
- **Routes**: Subtle brightness increase on hover
- **Points**: Gentle scale animation (1.0 → 1.2)
- **Tooltips**: 
  - Appear on hover over routes or points
  - Display travel date in clean, minimal typography
  - Semi-transparent dark background with white text
  - Smooth fade-in/fade-out transitions

### Camera Controls
- **Zoom**: Smooth, fluid zoom interaction
- **Pan**: Drag to explore different regions
- **Rotate**: Globe rotation with momentum/inertia
- **Initial View**: Start with a poetic angle showing multiple routes

## Component Structure

### Main Components
1. **Globe Container** - Full-screen black canvas with 3D globe
2. **Route Layer** - Luminous arcs with gradient materials
3. **Marker Layer** - Origin dots and meetup icons
4. **Tooltip Component** - Date information on hover
5. **Title Overlay** - Minimal "Love Letters" text
6. **Optional Particle Layer** - Faint background shimmer for atmosphere

## Responsive Behavior
- **All Viewports**: Maintain full-screen experience
- **Mobile**: Ensure touch controls work smoothly (pinch-zoom, drag-rotate)
- **Performance**: Optimize WebGL rendering for smooth 60fps

## Atmospheric Details
- **Depth**: Use subtle particle effects or three.js layer for dimensional quality
- **Motion**: Gentle, continuous subtle animations—never static
- **Contrast**: Routes and points should pop against the deep black
- **Emotional Tone**: Private, intimate, romantic—like reading secret correspondence

## Technical Visual Requirements
- **WebGL Rendering**: Smooth, anti-aliased curves
- **Gradient Quality**: High-quality interpolation between colors
- **Glow Effects**: Implement proper bloom/glow shaders for luminous quality
- **Animation Performance**: Silky smooth at 60fps minimum
- **No Loading States**: Instant visual feedback, preload all assets

## Images
**No images required** - This is a pure data visualization using programmatic graphics (WebGL/Canvas rendering for globe, routes, and markers).