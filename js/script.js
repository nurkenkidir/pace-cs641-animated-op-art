console.log("Version 1.1");

const canvas = document.getElementById('opArtCanvas');
const ctx = canvas.getContext('2d');

let width, height;

// Dynamic sizing to fill the browser window
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// Motion state for animation
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
const dampening = 0.02; // Slower, smoother gliding factor

// Handle Permission and Start
const overlay = document.getElementById('permission-overlay');
const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', () => {
    // Request permission for iOS 13+ devices
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                } else {
                    alert('Permission to access device motion was denied.');
                }
                overlay.classList.add('hidden');
            })
            .catch(console.error);
    } else {
        // Non-iOS 13+ devices (like Android or desktop). 
        // We still add the listener, but we check if motion is actually supported.
        if (!window.DeviceMotionEvent) {
            alert('Your browser/device does not support device motion.');
        }
        window.addEventListener('devicemotion', handleMotion);
        overlay.classList.add('hidden');
    }
});

let baselineX = null;
let baselineY = null;

function handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (acc && acc.x !== null) {
        // Calibrate the baseline the very first time the sensor fires
        if (baselineX === null) {
            baselineX = acc.x || 0;
            baselineY = acc.y || 0;
        }

        // Calculate how much the phone has moved relative to its starting position
        const deltaX = (acc.x || 0) - baselineX;
        const deltaY = (acc.y || 0) - baselineY;

        // Absolute positional changes relative to the baseline
        // Multiplier set to 15 for a subtle but noticeable shift.
        targetX = deltaX * 15;
        targetY = deltaY * 15;
    }
}

// =========================================================================
// Section 1: Wavy Background (Phase-shifted sine waves)
// =========================================================================
function drawWavyLines() {
    // Base color palette for background waves
    const colors = ['#d33d24', '#2a82a0', '#418b36', '#222222'];

    // Scale number of lines relative to height to keep visual density
    const numLines = Math.max(50, Math.floor(height / 7));
    const lineSpacing = height / numLines;

    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const freq = 0.018;
    const amp = 28;

    // Apply motion to shift waves horizontally (phase) and vertically (offset)
    const waveOffsetX = currentX * 0.08;
    const waveOffsetY = currentY * 0.8;

    for (let i = -20; i < numLines + 20; i++) {
        ctx.beginPath();

        ctx.strokeStyle = colors[Math.abs(i) % colors.length];

        const phaseShift = i * 0.18 + waveOffsetX;

        for (let x = 0; x <= width; x += 3) {
            const currentFreq = freq * (1 + x * 0.00015);
            const y = (i * lineSpacing) + Math.sin(x * currentFreq + phaseShift) * amp + waveOffsetY;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

// =========================================================================
// Section 2: Concentric Optical Illusion (Checkerboard Layers)
// =========================================================================
function drawZigZagIllusion() {
    // We want the wavy lines (left section) to take about 60% of the screen.
    const leftSectionRatio = 0.60;

    // To ensure the circle overflows the top and bottom, its radius must be > height / 2.
    const maxRadius = Math.max(height * 0.6, width * 0.5);

    // Position the vortex so its left edge starts exactly at the leftSectionRatio.
    // Left Edge = centerX - maxRadius => centerX = Left Edge + maxRadius
    const centerX = (width * leftSectionRatio) + maxRadius + (currentX * 1.5);
    const centerY = (height * 0.5) - (currentY * 1.5);

    const N = 72;
    const numLayers = 32;

    const d = (2 * Math.PI) / N;

    const A = d * 1.6;
    const W_thick = d * 1.8;
    const W_thin = d * 0.15;

    ctx.save();

    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#f4f4f4';
    ctx.fill();

    for (let L = 0; L < numLayers; L++) {
        let r_in = Math.pow(L / numLayers, 1.25) * maxRadius;
        let r_out = Math.pow((L + 1) / numLayers, 1.25) * maxRadius;

        let z_in = (L % 2 === 0) ? A : -A;
        let w_in = (L % 2 === 0) ? W_thick : W_thin;

        let z_out = ((L + 1) % 2 === 0) ? A : -A;
        let w_out = ((L + 1) % 2 === 0) ? W_thick : W_thin;

        for (let s = 0; s < N; s += 2) {
            let base = s * d;

            let a_in_left = base + z_in - w_in / 2;
            let a_in_right = base + z_in + w_in / 2;

            let a_out_left = base + z_out - w_out / 2;
            let a_out_right = base + z_out + w_out / 2;

            ctx.beginPath();
            ctx.moveTo(centerX + r_in * Math.cos(a_in_left), centerY + r_in * Math.sin(a_in_left));
            ctx.lineTo(centerX + r_out * Math.cos(a_out_left), centerY + r_out * Math.sin(a_out_left));
            ctx.lineTo(centerX + r_out * Math.cos(a_out_right), centerY + r_out * Math.sin(a_out_right));
            ctx.lineTo(centerX + r_in * Math.cos(a_in_right), centerY + r_in * Math.sin(a_in_right));
            ctx.closePath();

            ctx.fillStyle = '#111';
            ctx.fill();
        }
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f8f8f8';
    ctx.fill();

    ctx.restore();
}

// Animation loop
function animate() {
    // 1. Clear the canvas
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, 0, width, height);

    // 2. Math dampening (lerp) for smooth jitter-free movement
    currentX += (targetX - currentX) * dampening;
    currentY += (targetY - currentY) * dampening;

    // 3. Draw from scratch
    drawWavyLines();
    drawZigZagIllusion();

    // 4. Request next frame
    requestAnimationFrame(animate);
}

function startAnimation() {
    animate();
}

// Start animation loop immediately
startAnimation();
