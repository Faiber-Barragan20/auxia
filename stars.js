(function () {
    'use strict';

    var STAR_COUNT = 130;
    var REPULSION_RADIUS = 130;
    var REPULSION_STRENGTH = 50;
    var RETURN_SPEED = 0.03;
    var MOBILE_BREAKPOINT = 769;

    // Shooting stars
    var SHOOTING_STAR_INTERVAL = 1200;
    var shootingStars = [];

    var STAR_COLORS = [
        { r: 37, g: 209, b: 244 },
        { r: 13, g: 242, b: 242 },
        { r: 200, g: 230, b: 255 },
        { r: 255, g: 255, b: 255 }
    ];

    // Pre-compute color string prefixes
    var COLOR_PREFIXES = [];
    for (var ci = 0; ci < STAR_COLORS.length; ci++) {
        var c = STAR_COLORS[ci];
        COLOR_PREFIXES.push('rgba(' + c.r + ',' + c.g + ',' + c.b + ',');
    }

    // Pre-computed sine lookup table
    var SIN_TABLE_SIZE = 1024;
    var SIN_TABLE = new Float32Array(SIN_TABLE_SIZE);
    var SIN_SCALE = SIN_TABLE_SIZE / (Math.PI * 2);
    for (var si = 0; si < SIN_TABLE_SIZE; si++) {
        SIN_TABLE[si] = Math.sin((si / SIN_TABLE_SIZE) * Math.PI * 2);
    }
    function fastSin(x) {
        var idx = ((x * SIN_SCALE) % SIN_TABLE_SIZE) | 0;
        if (idx < 0) idx += SIN_TABLE_SIZE;
        return SIN_TABLE[idx];
    }

    var canvas, ctx;
    var stars = [];
    var mouseX = -9999, mouseY = -9999;
    var isActive = false;
    var animationId = null;
    var width = 0, height = 0;

    // Sprite cache: keyed by "colorIndex_radiusBucket"
    var spriteCache = {};

    function getRadiusBucket(radius) {
        // Quantize to 5 buckets: 0.7, 1.2, 1.7, 2.2, 2.7
        return Math.round(radius * 2) / 2;
    }

    function createStarSprite(colorIndex, radius) {
        var key = colorIndex + '_' + radius;
        if (spriteCache[key]) return spriteCache[key];

        var col = STAR_COLORS[colorIndex];
        var glowRadius = radius + 6;
        var size = Math.ceil(glowRadius * 2);
        var off = document.createElement('canvas');
        off.width = size * 2;
        off.height = size * 2;
        var c2 = off.getContext('2d');
        var cx = size, cy = size;

        var grad = c2.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        grad.addColorStop(0, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',1)');
        grad.addColorStop(0.25, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0.5)');
        grad.addColorStop(1, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');
        c2.fillStyle = grad;
        c2.fillRect(0, 0, size * 2, size * 2);

        var sprite = { canvas: off, size: size };
        spriteCache[key] = sprite;
        return sprite;
    }

    function createStar() {
        var colorIndex = Math.floor(Math.random() * STAR_COLORS.length);
        var color = STAR_COLORS[colorIndex];
        var x = Math.random() * width;
        var y = Math.random() * height;
        var radius = 0.7 + Math.random() * 2.2;
        var bucketRadius = getRadiusBucket(radius);
        return {
            x: x,
            y: y,
            originX: x,
            originY: y,
            radius: radius,
            color: color,
            colorIndex: colorIndex,
            colorPrefix: COLOR_PREFIXES[colorIndex],
            baseAlpha: 0.3 + Math.random() * 0.5,
            alpha: 0,
            twinkleOffset: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.01 + Math.random() * 0.02,
            sprite: radius > 1.5 ? createStarSprite(colorIndex, bucketRadius) : null,
            visible: true
        };
    }

    function initCanvas() {
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
        document.body.insertBefore(canvas, document.body.firstChild);
        ctx = canvas.getContext('2d');
        handleResize();
        for (var i = 0; i < STAR_COUNT; i++) {
            stars.push(createStar());
        }
    }

    function handleResize() {
        var dpr = window.devicePixelRatio || 1;
        var oldW = width, oldH = height;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (oldW > 0 && oldH > 0) {
            var sx = width / oldW, sy = height / oldH;
            for (var i = 0; i < stars.length; i++) {
                stars[i].originX *= sx;
                stars[i].originY *= sy;
                stars[i].x *= sx;
                stars[i].y *= sy;
            }
        }
    }

    function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    function onMouseLeave() {
        mouseX = -9999;
        mouseY = -9999;
    }

    // Adaptive quality system
    var qualityLevel = 2; // 0=low, 1=medium, 2=high
    var frameTimes = [];
    var qualityCooldown = 0;

    function measurePerformance(dt) {
        frameTimes.push(dt);
        if (frameTimes.length < 60) return;

        if (qualityCooldown > 0) {
            qualityCooldown--;
            frameTimes = [];
            return;
        }

        var avg = 0;
        for (var i = 0; i < frameTimes.length; i++) avg += frameTimes[i];
        avg /= frameTimes.length;
        var fps = 1000 / avg;

        if (fps < 24 && qualityLevel > 0) {
            qualityLevel--;
            applyQualityLevel();
            qualityCooldown = 2; // wait 2 cycles (120 frames) before re-evaluating
        } else if (fps > 50 && qualityLevel < 2) {
            qualityLevel++;
            applyQualityLevel();
            qualityCooldown = 2;
        }
        frameTimes = [];
    }

    function applyQualityLevel() {
        if (qualityLevel === 0) {
            for (var i = 0; i < stars.length; i++) stars[i].visible = (i % 2 === 0);
            clearInterval(shootingInterval);
            shootingInterval = null;
        } else if (qualityLevel === 1) {
            for (var i = 0; i < stars.length; i++) stars[i].visible = true;
            clearInterval(shootingInterval);
            shootingInterval = setInterval(spawnShootingStar, 3000);
        } else {
            for (var i = 0; i < stars.length; i++) stars[i].visible = true;
            clearInterval(shootingInterval);
            shootingInterval = setInterval(spawnShootingStar, SHOOTING_STAR_INTERVAL);
        }
    }

    // Delta-time animation
    var time = 0;
    var lastTimestamp = 0;

    function animate(timestamp) {
        // Delta time normalized to 60fps
        var rawDt = lastTimestamp ? (timestamp - lastTimestamp) : 16.667;
        lastTimestamp = timestamp;
        // Clamp dt to avoid huge jumps after tab switch
        if (rawDt > 100) rawDt = 16.667;
        var dt = rawDt / 16.667;
        time += dt;

        measurePerformance(rawDt);

        ctx.clearRect(0, 0, width, height);

        var rr = REPULSION_RADIUS * REPULSION_RADIUS;

        // Buckets for batching small stars by color
        var smallBuckets = [[], [], [], []];

        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            if (!s.visible) continue;

            // Twinkle using fast sine
            s.alpha = s.baseAlpha + 0.2 * fastSin(time * s.twinkleSpeed + s.twinkleOffset);

            // Repulsion
            var dx = s.x - mouseX;
            var dy = s.y - mouseY;
            var distSq = dx * dx + dy * dy;
            if (distSq < rr && distSq > 0) {
                var dist = Math.sqrt(distSq);
                var force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH;
                s.x += (dx / dist) * force;
                s.y += (dy / dist) * force;
            }

            // Return to origin
            s.x += (s.originX - s.x) * RETURN_SPEED;
            s.y += (s.originY - s.y) * RETURN_SPEED;

            // Draw: sprite for large stars, batch small ones
            if (s.sprite) {
                ctx.globalAlpha = Math.max(0, s.alpha);
                ctx.drawImage(s.sprite.canvas, s.x - s.sprite.size, s.y - s.sprite.size);
            } else {
                smallBuckets[s.colorIndex].push(s);
            }
        }

        // Reset globalAlpha after sprite drawing
        ctx.globalAlpha = 1.0;

        // Batch render small stars by color
        for (var b = 0; b < 4; b++) {
            var bucket = smallBuckets[b];
            if (bucket.length === 0) continue;

            // Use average alpha for the batch (acceptable visual trade-off)
            var avgAlpha = 0;
            for (var k = 0; k < bucket.length; k++) avgAlpha += bucket[k].alpha;
            avgAlpha = Math.max(0, avgAlpha / bucket.length);

            ctx.beginPath();
            for (var k = 0; k < bucket.length; k++) {
                var bs = bucket[k];
                ctx.moveTo(bs.x + bs.radius, bs.y);
                ctx.arc(bs.x, bs.y, bs.radius, 0, Math.PI * 2);
            }
            ctx.fillStyle = COLOR_PREFIXES[b] + avgAlpha + ')';
            ctx.fill();
        }

        // Draw shooting stars (no shadowBlur)
        for (var j = shootingStars.length - 1; j >= 0; j--) {
            var ss = shootingStars[j];
            ss.x += ss.vx * dt;
            ss.y += ss.vy * dt;
            ss.life -= dt;

            var lifeRatio = ss.life / ss.maxLife;
            var alpha = lifeRatio < 0.3 ? lifeRatio / 0.3 : (lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : 1);
            var tailLen = ss.speed * 12;
            var tailX = ss.x - ss.vx / ss.speed * tailLen;
            var tailY = ss.y - ss.vy / ss.speed * tailLen;

            var grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
            grad.addColorStop(0, 'rgba(200, 230, 255, ' + alpha * 0.8 + ')');
            grad.addColorStop(0.4, 'rgba(37, 209, 244, ' + alpha * 0.4 + ')');
            grad.addColorStop(1, 'rgba(37, 209, 244, 0)');

            // Outer glow stroke (replaces shadowBlur)
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = 'rgba(37, 209, 244, ' + alpha * 0.15 + ')';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Core stroke
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (ss.life <= 0 || ss.x < -50 || ss.x > width + 50 || ss.y > height + 50) {
                shootingStars.splice(j, 1);
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    function spawnShootingStar() {
        var side = Math.floor(Math.random() * 3);
        var startX, startY, angle;
        var speed = 4 + Math.random() * 4;
        var maxLife = 60 + Math.floor(Math.random() * 40);

        if (side === 0) {
            startX = Math.random() * width;
            startY = -10;
            angle = Math.PI / 6 + Math.random() * (Math.PI * 2 / 3);
        } else if (side === 1) {
            startX = -10;
            startY = Math.random() * height * 0.6;
            angle = -Math.PI / 6 + Math.random() * Math.PI / 3;
        } else {
            startX = width + 10;
            startY = Math.random() * height * 0.6;
            angle = Math.PI - Math.PI / 6 + Math.random() * Math.PI / 3;
        }

        shootingStars.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            speed: speed,
            life: maxLife,
            maxLife: maxLife
        });
    }

    var shootingInterval = null;

    function start() {
        if (isActive) return;
        isActive = true;
        spriteCache = {};
        initCanvas();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseleave', onMouseLeave);
        lastTimestamp = 0;
        qualityLevel = 2;
        frameTimes = [];
        qualityCooldown = 0;
        animationId = requestAnimationFrame(animate);
        spawnShootingStar();
        shootingInterval = setInterval(spawnShootingStar, SHOOTING_STAR_INTERVAL);
    }

    function stop() {
        if (!isActive) return;
        isActive = false;
        cancelAnimationFrame(animationId);
        clearInterval(shootingInterval);
        shootingInterval = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseleave', onMouseLeave);
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        canvas = null;
        ctx = null;
        stars = [];
        shootingStars = [];
        spriteCache = {};
        width = 0;
        height = 0;
    }

    function isMobile() {
        return window.innerWidth < MOBILE_BREAKPOINT;
    }

    var resizeTimer;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (isMobile() && isActive) stop();
            if (!isMobile() && !isActive) start();
            if (isActive) handleResize();
        }, 200);
    }

    // Page Visibility API: pause when tab is hidden
    function onVisibilityChange() {
        if (document.hidden) {
            if (isActive) {
                cancelAnimationFrame(animationId);
                clearInterval(shootingInterval);
                shootingInterval = null;
            }
        } else {
            if (isActive) {
                lastTimestamp = 0;
                animationId = requestAnimationFrame(animate);
                if (qualityLevel === 2) {
                    shootingInterval = setInterval(spawnShootingStar, SHOOTING_STAR_INTERVAL);
                } else if (qualityLevel === 1) {
                    shootingInterval = setInterval(spawnShootingStar, 3000);
                }
            }
        }
    }

    function initFuturisticTitles() {
        var titles = document.querySelectorAll('.futuristic-title');
        titles.forEach(function (el) {
            el.addEventListener('mouseenter', function () {
                if (el.classList.contains('animating')) return;
                el.classList.add('animating');
                el.addEventListener('animationend', function handler() {
                    el.classList.remove('animating');
                    el.removeEventListener('animationend', handler);
                });
            });
        });
    }

    function init() {
        if (!isMobile()) start();
        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibilityChange);
        initFuturisticTitles();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
