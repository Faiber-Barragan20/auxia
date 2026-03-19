(function () {
    'use strict';

    var STAR_COUNT = 200;
    var REPULSION_RADIUS = 130;
    var REPULSION_STRENGTH = 50;
    var RETURN_SPEED = 0.03;
    var MOBILE_BREAKPOINT = 769;

    // Shooting stars
    var SHOOTING_STAR_INTERVAL = 1200; // ms between shooting stars
    var shootingStars = [];

    var STAR_COLORS = [
        { r: 37, g: 209, b: 244 },
        { r: 13, g: 242, b: 242 },
        { r: 200, g: 230, b: 255 },
        { r: 255, g: 255, b: 255 }
    ];

    var canvas, ctx;
    var stars = [];
    var mouseX = -9999, mouseY = -9999;
    var isActive = false;
    var animationId = null;
    var width = 0, height = 0;

    function createStar() {
        var color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        var x = Math.random() * width;
        var y = Math.random() * height;
        return {
            x: x,
            y: y,
            originX: x,
            originY: y,
            radius: 0.5 + Math.random() * 2,
            color: color,
            baseAlpha: 0.3 + Math.random() * 0.5,
            alpha: 0,
            twinkleOffset: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.01 + Math.random() * 0.02
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

    var time = 0;
    function animate() {
        time++;
        ctx.clearRect(0, 0, width, height);

        var rr = REPULSION_RADIUS * REPULSION_RADIUS;

        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];

            // Twinkle
            s.alpha = s.baseAlpha + 0.2 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset);

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

            // Draw
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);

            if (s.radius > 1.5) {
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(' + s.color.r + ',' + s.color.g + ',' + s.color.b + ',0.6)';
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = 'rgba(' + s.color.r + ',' + s.color.g + ',' + s.color.b + ',' + Math.max(0, s.alpha) + ')';
            ctx.fill();
        }

        ctx.shadowBlur = 0;

        // Draw shooting stars
        for (var j = shootingStars.length - 1; j >= 0; j--) {
            var ss = shootingStars[j];
            ss.x += ss.vx;
            ss.y += ss.vy;
            ss.life--;

            var lifeRatio = ss.life / ss.maxLife;
            var alpha = lifeRatio < 0.3 ? lifeRatio / 0.3 : (lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : 1);
            var tailLen = ss.speed * 12;

            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(ss.x - ss.vx / ss.speed * tailLen, ss.y - ss.vy / ss.speed * tailLen);

            var grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx / ss.speed * tailLen, ss.y - ss.vy / ss.speed * tailLen);
            grad.addColorStop(0, 'rgba(37, 209, 244, ' + alpha * 0.9 + ')');
            grad.addColorStop(0.4, 'rgba(255, 255, 255, ' + alpha * 0.6 + ')');
            grad.addColorStop(1, 'rgba(37, 209, 244, 0)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(37, 209, 244, ' + alpha * 0.5 + ')';
            ctx.stroke();

            if (ss.life <= 0 || ss.x < -50 || ss.x > width + 50 || ss.y > height + 50) {
                shootingStars.splice(j, 1);
            }
        }

        ctx.shadowBlur = 0;
        animationId = requestAnimationFrame(animate);
    }

    function spawnShootingStar() {
        var side = Math.floor(Math.random() * 3); // 0=top, 1=left, 2=right
        var startX, startY, angle;
        var speed = 4 + Math.random() * 4;
        var maxLife = 60 + Math.floor(Math.random() * 40);

        if (side === 0) {
            // From top
            startX = Math.random() * width;
            startY = -10;
            angle = Math.PI / 6 + Math.random() * (Math.PI * 2 / 3);
        } else if (side === 1) {
            // From left
            startX = -10;
            startY = Math.random() * height * 0.6;
            angle = -Math.PI / 6 + Math.random() * Math.PI / 3;
        } else {
            // From right
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
        initCanvas();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseleave', onMouseLeave);
        animate();
        spawnShootingStar();
        shootingInterval = setInterval(spawnShootingStar, SHOOTING_STAR_INTERVAL);
    }

    function stop() {
        if (!isActive) return;
        isActive = false;
        cancelAnimationFrame(animationId);
        clearInterval(shootingInterval);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseleave', onMouseLeave);
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        canvas = null;
        ctx = null;
        stars = [];
        shootingStars = [];
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
        initFuturisticTitles();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
