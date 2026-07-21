import React, { useRef, useEffect } from 'react';

export function GooeyText({
  texts = ["Air Quality", "AI Enforcement", "Pollution Analytics", "Vayu Intelligence"],
  morphTime = 1.2,
  cooldownTime = 0.5,
  className = "",
  textClassName = "",
  style = {}
}) {
  const text1Ref = useRef(null);
  const text2Ref = useRef(null);

  useEffect(() => {
    if (!texts || texts.length === 0) return;
    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;
    let animFrameId = null;

    const setMorph = (fraction) => {
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

        fraction = 1 - fraction;
        text1Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text1Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      }
    };

    const doCooldown = () => {
      morph = 0;
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = "";
        text2Ref.current.style.opacity = "100%";
        text1Ref.current.style.filter = "";
        text1Ref.current.style.opacity = "0%";
      }
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    };

    function animate() {
      animFrameId = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length];
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    animate();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [texts, morphTime, cooldownTime]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', minHeight: 100, ...style }} className={className}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true" focusable="false">
        <defs>
          <filter id="gooey-threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'url(#gooey-threshold)',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        <span
          ref={text1Ref}
          className={textClassName}
          style={{
            position: 'absolute',
            userSelect: 'none',
            textAlign: 'center',
            width: '100%',
            whiteSpace: 'nowrap',
          }}
        />
        <span
          ref={text2Ref}
          className={textClassName}
          style={{
            position: 'absolute',
            userSelect: 'none',
            textAlign: 'center',
            width: '100%',
            whiteSpace: 'nowrap',
          }}
        />
      </div>
    </div>
  );
}
