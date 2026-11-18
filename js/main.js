/* =================================
   MAIN.JS - vanilla JavaScript only
   Hero phase: theme toggle + responsive navigation
================================= */

(function () {
    "use strict";

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (selector, scope) => (scope || document).querySelector(selector);
    const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

    /* ---------- Theme toggle (remembers choice) ---------- */
    const themeToggle = $("#themeToggle");
    const themeMeta = $('meta[name="theme-color"]');

    const syncTheme = function () {
        const isLight = root.getAttribute("data-theme") === "light";

        if (themeToggle) {
            themeToggle.textContent = isLight ? "☾" : "☀";
            themeToggle.setAttribute(
                "aria-label",
                isLight ? "Switch to dark theme" : "Switch to light theme"
            );
        }

        if (themeMeta) {
            themeMeta.setAttribute(
                "content",
                getComputedStyle(root).getPropertyValue("--bg-primary").trim()
            );
        }
    };

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
            root.setAttribute("data-theme", next);

            try {
                localStorage.setItem("theme", next);
            } catch (e) {
                /* ignore */
            }

            syncTheme();
        });
    }

    syncTheme();

    /* ---------- Navbar: scroll state, mobile menu, active link ---------- */
    const navbar = $("#navbar");
    const menuToggle = $("#menuToggle");
    const navMenu = $("#navMenu");

    window.addEventListener("scroll", function () {
        if (navbar) {
            navbar.classList.toggle("scrolled", window.scrollY > 20);
        }
    }, { passive: true });

    const setMenu = function (open) {
        if (!menuToggle || !navMenu) return;

        navMenu.classList.toggle("active", open);
        menuToggle.textContent = open ? "✕" : "☰";
        menuToggle.setAttribute("aria-expanded", String(open));
    };

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", function () {
            setMenu(!navMenu.classList.contains("active"));
        });

        $$("a", navMenu).forEach(function (link) {
            link.addEventListener("click", function () {
                setMenu(false);
            });
        });

        document.addEventListener("click", function (event) {
            if (navbar && !navbar.contains(event.target)) {
                setMenu(false);
            }
        });
    }

    if ("IntersectionObserver" in window && navMenu) {
        const links = $$("a", navMenu);

        const sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                links.forEach(function (link) {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === "#" + entry.target.id
                    );
                });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });

        $$("main > section[id]").forEach(function (section) {
            sectionObserver.observe(section);
        });
    }


    /* ---------- Scroll reveal (staggered) ---------- */
    const revealElements = $$(".reveal");

    revealElements.forEach(function (element) {
        const index = Array.from(element.parentElement.children).indexOf(element);
        element.style.setProperty("--delay", Math.min(index, 5) * 0.07 + "s");
    });

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        revealElements.forEach(function (element) {
            revealObserver.observe(element);
        });
    } else {
        revealElements.forEach(function (element) {
            element.classList.add("visible");
        });
    }


    /* ---------- Timeline "Show more" ---------- */
    $$(".toggle-more").forEach(function (button) {
        button.addEventListener("click", function () {
            const card = button.closest(".timeline-card");
            if (!card) return;

            const expanded = card.classList.toggle("expanded");

            button.textContent = expanded ? "Show less" : "Show more";
            button.setAttribute("aria-expanded", String(expanded));
        });
    });



    /* ---------- Looping video clips (gaming + sports) ---------- */
    $$(".clip-player").forEach(function (player) {
        const clips = $$(".clip", player);
        const tabs = $$(".clip-tab", player);

        let current = 0;
        let inView = false;

        const show = function (index) {
            current = index;

            clips.forEach(function (clip, n) {
                const video = $("video", clip);
                const active = n === index;

                clip.classList.toggle("active", active);

                if (tabs[n]) {
                    tabs[n].classList.toggle("active", active);
                }

                if (!video) return;

                if (active) {
                    video.currentTime = 0;

                    if (inView && !reduceMotion) {
                        video.play().catch(function () {
                            /* autoplay blocked */
                        });
                    }
                } else {
                    video.pause();
                }
            });
        };

        const next = function () {
            for (let step = 1; step <= clips.length; step++) {
                const n = (current + step) % clips.length;

                if (!clips[n].classList.contains("is-empty")) {
                    show(n);
                    return;
                }
            }
        };

        clips.forEach(function (clip) {
            const video = $("video", clip);
            if (!video) return;

            video.muted = true;

            video.addEventListener("ended", next);

            video.addEventListener("error", function () {
                clip.classList.add("is-empty");

                if (clips[current] === clip) {
                    next();
                }
            });
        });

        tabs.forEach(function (tab, n) {
            tab.addEventListener("click", function () {
                show(n);
            });
        });

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                inView = entries[0].isIntersecting;

                const video = $("video", clips[current]);
                if (!video) return;

                if (inView && !reduceMotion) {
                    video.play().catch(function () {
                        /* autoplay blocked */
                    });
                } else {
                    video.pause();
                }
            }, { threshold: 0.25 }).observe(player);
        }
    });


})();
