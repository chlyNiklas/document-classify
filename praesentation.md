---
title: "Hackathon 2026 Pitch"
theme: klassifikator
draft: false
description: KOBY classify
transition: slide
autoPlayMedia: true
hash: true
plugins:
  - math
  - notes
  - zoom
customStyle: |
  .stamp {
    float: right;
    position: absolute;
    top: 0;
    left: 0;

    opacity: 0;
    transform: rotate(-30deg) scale(1.6);
    transform-origin: center;
  }

  .stamp.visible {
    animation: stamp-in 0.22s cubic-bezier(.15,.85,.25,1.15) forwards;
  }

  @keyframes stamp-in {
    0% {
      opacity: 0;
      filter: blur(20px);
      transform: rotate(-20deg) scale(1.6);
    }

    70% {
      opacity: 1;
      filter: blur(0);
      transform: rotate(-10deg) scale(.92);
    }

    100% {
      opacity: 1;
      filter: blur(0);
      transform: rotate(-10deg) scale(1);
    }
  }
customJS: presentations/hackathon-pitch/stamp.js
---

<!-- auto-animate -->

<img src="chwappen.png" height="100" style="float: left" /><h3>VERTRAULICH</h3>
<h1 class="r-fit-text">KOBY classify</h1>
<h2>BIT</h2>

---

<!-- auto-animate -->

<h3>Moment...</h3>
<img src="chwappen.png" height="100" style="float: left" /><h3>VERTRAULICH</h3>
<h1>?</h1>

-v-

-aa-

<!-- background-video: isv.mp4 -->
<!-- background-video-loop -->
<h1>Sehen wir 'mal...</h1>

---

<!-- background-iframe: http://classify.schreifuchs.ch -->
&nbsp;

-v-

Placeholder für Video

---

-aa-

<img src="chwappen.png" height="100" style="float: left" /><h3><span class="fragment strike" data-fragment-index="1">VERTRAULICH</span></h3>
<h1 class="r-fit-text">KOBY classify</h1>
<h2>BIT</h2>
  <img
    class="stamp fragment"
    data-fragment-index="1"
    src="nichtvertraulich.png"
    style="
      width: 80%;
      height: 100%;
      object-fit: contain;
      max-width: none;
      max-height: none;
      margin-top: 20%;
    "
  />
